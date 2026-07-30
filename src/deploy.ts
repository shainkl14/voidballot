import { WebSocket } from 'ws';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import pino from 'pino';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

import { getConfig } from './config.js';
import { ensureDust } from './dust.js';
import {
  MidnightWalletProvider,
  resolveDeploySeed,
  syncWallet,
} from './wallet.js';
import { buildProviders } from './providers.js';
import {
  CompiledVoidBallotContract,
  zkConfigPath,
} from '../contracts/index.js';
import { createInitialPrivateState } from '../contracts/witnesses.js';
import type { EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';

// @ts-expect-error WebSocket global assignment for apollo
globalThis.WebSocket = WebSocket;

const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport: { target: 'pino-pretty' },
});

const PRIVATE_STATE_ID = 'VoidBallotDeployState';
const VOTER_SECRET = new Uint8Array(32).fill(0x0a);

function proposalBytes(label: string): Uint8Array {
  const hash = createHash('sha256').update(label).digest();
  return new Uint8Array(hash);
}

async function main() {
  const config = getConfig();
  const seed = resolveDeploySeed(config.networkId);
  setNetworkId(config.networkId);

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

  const proposalLabel =
    process.env['VOIDBALLOT_PROPOSAL'] ??
    'Chamber Measure: Seal the void corridor by midnight.';

  logger.info(`Deploying VoidBallot on ${config.networkId} (run yarn env:up first)`);
  if (config.networkId === 'undeployed' && process.env['USE_CUSTOM_WALLET'] !== '1') {
    logger.info('Using genesis wallet (pre-funded on local devnet)');
  }
  logger.info(`Proposal: ${proposalLabel}`);

  const wallet = await MidnightWalletProvider.build(logger, envConfig, seed);
  await wallet.start();
  await syncWallet(logger, wallet.wallet, 600_000);
  await ensureDust(logger, wallet.wallet, wallet.unshieldedKeystore);

  const providers = buildProviders(wallet, zkConfigPath, config, 'deploy');

  const deployed: any = await (deployContract as any)(providers, {
    compiledContract: CompiledVoidBallotContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: createInitialPrivateState(VOTER_SECRET),
    args: [proposalBytes(proposalLabel)],
  });

  const contractAddress = deployed.deployTxData.public.contractAddress;
  logger.info(`Contract deployed at: ${contractAddress}`);

  const deploymentRecord = {
    network: config.networkId,
    contractAddress,
    proposal: proposalLabel,
    deployedAt: new Date().toISOString(),
  };

  const outPath = resolve(process.cwd(), 'deployment.json');
  writeFileSync(outPath, JSON.stringify(deploymentRecord, null, 2));
  logger.info(`Wrote ${outPath}`);

  await wallet.stop();
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
