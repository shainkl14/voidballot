import {
  createUnprovenDeployTx,
  submitCallTxAsync,
  submitTxAsync,
} from '@midnight-ntwrk/midnight-js-contracts';
import { ContractState, sampleSigningKey } from '@midnight-ntwrk/compact-runtime';
import {
  CompiledVoidBallotContract,
  ledger,
  pureCircuits,
} from './contract.js';
import {
  createInitialPrivateState,
  type VoidBallotPrivateState,
} from '@contracts/witnesses.js';
import type { ConnectedSession } from './midnight';
import { fromHex, pollForState, toHex } from './midnight';

const PRIVATE_STATE_ID = 'voidBallotPrivateState';
const SECRET_STORAGE_KEY = 'voidballot-voter-secret';
export const ZK_PATH = '/zk/void-ballot';
export const CONTRACT_STORAGE_KEY = 'voidballot-contract';

export type BallotChoice = 0 | 1 | 2;

export const CHOICE_LABELS: Record<BallotChoice, string> = {
  0: 'Aye',
  1: 'Nay',
  2: 'Void',
};

export type ChamberState = {
  proposalHash: string;
  votesAye: number;
  votesNay: number;
  votesVoid: number;
  totalBallots: number;
};

function makeCompiledContract() {
  return CompiledVoidBallotContract as any;
}

export function getOrCreateSecrets(): VoidBallotPrivateState {
  const stored = localStorage.getItem(SECRET_STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored) as { voterSecret: number[] };
    return createInitialPrivateState(new Uint8Array(parsed.voterSecret));
  }
  const voterSecret = crypto.getRandomValues(new Uint8Array(32));
  localStorage.setItem(
    SECRET_STORAGE_KEY,
    JSON.stringify({ voterSecret: Array.from(voterSecret) }),
  );
  return createInitialPrivateState(voterSecret);
}

export function getNullifierPreview(secrets: VoidBallotPrivateState): string {
  return toHex(pureCircuits.voterNullifier(secrets.voterSecret));
}

export async function hashProposal(text: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(text.trim() || 'VoidBallot chamber proposal');
  const digest = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(digest);
}

export async function deployChamber(
  session: ConnectedSession,
  proposalText: string,
): Promise<string> {
  const initialPrivateState = getOrCreateSecrets();
  const proposal = await hashProposal(proposalText);
  const deployTxData = await (createUnprovenDeployTx as any)(
    {
      zkConfigProvider: session.providers.zkConfigProvider,
      walletProvider: session.providers.walletProvider,
    },
    {
      compiledContract: makeCompiledContract(),
      args: [proposal],
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState,
      signingKey: sampleSigningKey(),
    },
  );
  const contractAddress = deployTxData.public.contractAddress;
  await (submitTxAsync as any)(session.providers, {
    unprovenTx: deployTxData.private.unprovenTx,
  });
  await session.providers.privateStateProvider.setContractAddress(contractAddress);
  await session.providers.privateStateProvider.set(PRIVATE_STATE_ID, initialPrivateState);
  await session.providers.privateStateProvider.setSigningKey(
    contractAddress,
    deployTxData.private.signingKey,
  );
  return contractAddress;
}

export async function castBallot(
  session: ConnectedSession,
  contractAddress: string,
  choice: BallotChoice,
) {
  await session.providers.privateStateProvider.setContractAddress(contractAddress);
  const secrets = getOrCreateSecrets();
  await session.providers.privateStateProvider.set(PRIVATE_STATE_ID, secrets);
  await (submitCallTxAsync as any)(session.providers, {
    compiledContract: makeCompiledContract(),
    contractAddress,
    circuitId: 'castBallot',
    args: [BigInt(choice)],
    privateStateId: PRIVATE_STATE_ID,
  });
}

export async function proveVoted(
  session: ConnectedSession,
  contractAddress: string,
) {
  await session.providers.privateStateProvider.setContractAddress(contractAddress);
  const secrets = getOrCreateSecrets();
  await session.providers.privateStateProvider.set(PRIVATE_STATE_ID, secrets);
  await (submitCallTxAsync as any)(session.providers, {
    compiledContract: makeCompiledContract(),
    contractAddress,
    circuitId: 'proveVoted',
    args: [],
    privateStateId: PRIVATE_STATE_ID,
  });
}

export function decodeChamberState(stateHex: string): ChamberState {
  const contractState = ContractState.deserialize(fromHex(stateHex));
  const l = ledger(contractState.data);
  return {
    proposalHash: toHex(l.proposalHash),
    votesAye: Number(l.votesAye as unknown as bigint),
    votesNay: Number(l.votesNay as unknown as bigint),
    votesVoid: Number(l.votesVoid as unknown as bigint),
    totalBallots: Number(l.totalBallots as unknown as bigint),
  };
}

export async function fetchChamberState(
  queryUrl: string,
  contractAddress: string,
): Promise<ChamberState> {
  const hex = await pollForState(queryUrl, contractAddress);
  return decodeChamberState(hex);
}
