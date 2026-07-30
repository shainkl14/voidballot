import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocket } from 'ws';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  deployContract,
  submitCallTx,
} from '@midnight-ntwrk/midnight-js-contracts';
import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import pino from 'pino';
import { createHash } from 'node:crypto';

import { getConfig } from '../config.js';
import {
  MidnightWalletProvider,
  GENESIS_WALLET_SEED,
  syncWallet,
} from '../wallet.js';
import { buildProviders, type VoidBallotProviders } from '../providers.js';
import {
  CompiledVoidBallotContract,
  ledger,
  pureCircuits,
  zkConfigPath,
} from '../../contracts/index.js';
import { createInitialPrivateState } from '../../contracts/witnesses.js';
import type { EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';

// @ts-expect-error WebSocket global assignment for apollo
globalThis.WebSocket = WebSocket;

const ALICE_SEED = GENESIS_WALLET_SEED;
const ALICE_PRIVATE_STATE_ID = 'AliceVoidBallotState';

const VOTER_SECRET = new Uint8Array(32).fill(0x42);
const PROPOSAL = createHash('sha256')
  .update('VoidBallot test proposal')
  .digest();

const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport: { target: 'pino-pretty' },
});

describe('VoidBallot Contract', () => {
  let aliceWallet: MidnightWalletProvider;
  let aliceProviders: VoidBallotProviders;
  let contractAddress: ContractAddress;
  let expectedNullifier: Uint8Array;

  const config = getConfig();

  async function queryLedger(providers: VoidBallotProviders) {
    const state =
      await providers.publicDataProvider.queryContractState(contractAddress);
    expect(state).not.toBeNull();
    return ledger(state!.data);
  }

  beforeAll(async () => {
    setNetworkId(config.networkId);

    expectedNullifier = pureCircuits.voterNullifier(VOTER_SECRET);

    const envConfig: EnvironmentConfiguration = {
      walletNetworkId: config.networkId,
      networkId: config.networkId,
      indexer: config.indexer,
      indexerWS: config.indexerWS,
      node: config.node,
      nodeWS: config.nodeWS,
      faucet: config.faucet,
      proofServer: config.proofServer,
    };

    aliceWallet = await MidnightWalletProvider.build(
      logger,
      envConfig,
      ALICE_SEED,
    );
    await aliceWallet.start();
    await syncWallet(logger, aliceWallet.wallet, 600_000);

    aliceProviders = buildProviders(aliceWallet, zkConfigPath, config);
    logger.info('Providers initialized. Ready to test!');
  });

  afterAll(async () => {
    if (aliceWallet) {
      logger.info('Stopping Alice wallet...');
      await aliceWallet.stop();
    }
  });

  it('deploys the chamber with a proposal hash', async () => {
    const deployed: any = await (deployContract as any)(aliceProviders, {
      compiledContract: CompiledVoidBallotContract,
      privateStateId: ALICE_PRIVATE_STATE_ID,
      initialPrivateState: createInitialPrivateState(VOTER_SECRET),
      args: [new Uint8Array(PROPOSAL)],
    });

    contractAddress = deployed.deployTxData.public.contractAddress;
    logger.info(`Contract deployed at: ${contractAddress}`);
    expect(contractAddress).toBeDefined();
    expect(contractAddress.length).toBeGreaterThan(0);

    const state = await queryLedger(aliceProviders);
    expect(state.chamberSealed).toEqual(0n);
    expect(state.totalBallots).toEqual(0n);
    expect(state.proposalHash).toEqual(new Uint8Array(PROPOSAL));
  });

  it('casts an anonymous aye ballot and updates public tally', async () => {
    await (submitCallTx as any)(aliceProviders, {
      compiledContract: CompiledVoidBallotContract,
      contractAddress,
      privateStateId: ALICE_PRIVATE_STATE_ID,
      circuitId: 'castBallot',
      args: [0n],
    });

    const state = await queryLedger(aliceProviders);
    expect(state.totalBallots).toEqual(1n);
    expect(state.votesAye).toEqual(1n);
    expect(state.votesNay).toEqual(0n);
    expect(state.votesVoid).toEqual(0n);
    expect(state.usedNullifiers.member(expectedNullifier)).toBe(true);
  });

  it('proves the voter cast a ballot without revealing wallet identity', async () => {
    await (submitCallTx as any)(aliceProviders, {
      compiledContract: CompiledVoidBallotContract,
      contractAddress,
      privateStateId: ALICE_PRIVATE_STATE_ID,
      circuitId: 'proveVoted',
      args: [],
    });

    const state = await queryLedger(aliceProviders);
    expect(state.usedNullifiers.member(expectedNullifier)).toBe(true);
  });

  it('rejects a second ballot from the same nullifier', async () => {
    await expect(
      (submitCallTx as any)(aliceProviders, {
        compiledContract: CompiledVoidBallotContract,
        contractAddress,
        privateStateId: ALICE_PRIVATE_STATE_ID,
        circuitId: 'castBallot',
        args: [1n],
      }),
    ).rejects.toThrow();
  });

  it('seals the chamber', async () => {
    await (submitCallTx as any)(aliceProviders, {
      compiledContract: CompiledVoidBallotContract,
      contractAddress,
      privateStateId: ALICE_PRIVATE_STATE_ID,
      circuitId: 'sealChamber',
      args: [],
    });

    const state = await queryLedger(aliceProviders);
    expect(state.chamberSealed).toEqual(1n);
  });
});
