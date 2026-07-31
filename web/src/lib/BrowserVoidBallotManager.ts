/**
 * Browser provider setup — mirrors darktalent BrowserDarkTalentManager.
 */
import {
  catchError,
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  take,
  throwError,
  timeout,
} from 'rxjs';
import { pipe as fnPipe } from 'fp-ts/function';
import semver from 'semver';
import type { Logger } from 'pino';
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { setNetworkId, type NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import {
  Binding,
  type FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
  type TransactionId,
} from '@midnight-ntwrk/ledger-v8';
import { fromHex, toHex } from '@midnight-ntwrk/compact-runtime';
import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';

import {
  VoidBallotAPI,
  type BallotChoice,
  type VoidBallotCircuitKeys,
  type VoidBallotProviders,
} from '../../../api/src/index.js';
import {
  createInitialPrivateState,
  type VoidBallotPrivateState,
} from '@contracts/witnesses.js';
import { inMemoryPrivateStateProvider } from '../in-memory-private-state-provider.js';
import { NETWORK_ID, ZK_ASSET_ORIGIN } from '../config.js';

const COMPATIBLE_CONNECTOR_API_VERSION = '4.x';
const SECRET_STORAGE_KEY = 'voidballot-voter-secret';

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

const getFirstCompatibleWallet = (): InitialAPI | undefined => {
  const midnight = (window as any).midnight;
  if (!midnight) return undefined;
  return Object.values(midnight).find(
    (wallet): wallet is InitialAPI =>
      !!wallet &&
      typeof wallet === 'object' &&
      'apiVersion' in wallet &&
      semver.satisfies(String((wallet as InitialAPI).apiVersion), COMPATIBLE_CONNECTOR_API_VERSION),
  );
};

const connectToWallet = (networkId: string): Promise<ConnectedAPI> =>
  firstValueFrom(
    fnPipe(
      interval(100),
      map(() => getFirstCompatibleWallet()),
      filter((api): api is InitialAPI => !!api),
      take(1),
      timeout({
        first: 5_000,
        with: () =>
          throwError(() => new Error('No Midnight wallet found. Install Lace or 1AM.')),
      }),
      concatMap(async (initialAPI) => initialAPI.connect(networkId)),
      timeout({
        first: 15_000,
        with: () => throwError(() => new Error('Wallet failed to connect.')),
      }),
      catchError((error) =>
        throwError(() => (error instanceof Error ? error : new Error('Wallet not authorized'))),
      ),
    ),
  );

async function initializeProviders(logger: Logger): Promise<{
  providers: VoidBallotProviders;
  connectedAPI: ConnectedAPI;
  unshieldedAddress: string;
}> {
  setNetworkId(NETWORK_ID as NetworkId);

  const connectedAPI = await connectToWallet(NETWORK_ID);
  const config = await connectedAPI.getConfiguration();
  const proofServerUri = config.proverServerUri;
  if (!proofServerUri) {
    throw new Error('Wallet did not provide a proof server URI.');
  }

  logger.info({ proofServerUri, networkId: config.networkId }, 'Wallet configuration');

  const shieldedAddresses = await connectedAPI.getShieldedAddresses();
  const unshielded = await connectedAPI.getUnshieldedAddress();
  const zkConfigProvider = new FetchZkConfigProvider<VoidBallotCircuitKeys>(
    ZK_ASSET_ORIGIN,
    fetch.bind(window),
  );

  const providers = {
    privateStateProvider: inMemoryPrivateStateProvider(),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(proofServerUri, zkConfigProvider),
    publicDataProvider: indexerPublicDataProvider(config.indexerUri, config.indexerWsUri),
    walletProvider: {
      getCoinPublicKey: () => shieldedAddresses.shieldedCoinPublicKey,
      getEncryptionPublicKey: () => shieldedAddresses.shieldedEncryptionPublicKey,
      balanceTx: async (tx: UnboundTransaction): Promise<FinalizedTransaction> => {
        const received = await connectedAPI.balanceUnsealedTransaction(toHex(tx.serialize()));
        return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
          'signature',
          'proof',
          'binding',
          fromHex(received.tx),
        );
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        await connectedAPI.submitTransaction(toHex(tx.serialize()));
        return tx.identifiers()[0];
      },
    },
  } as VoidBallotProviders;

  return {
    providers,
    connectedAPI,
    unshieldedAddress: unshielded.unshieldedAddress,
  };
}

export class BrowserVoidBallotManager {
  #providersPromise: ReturnType<typeof initializeProviders> | undefined;
  #apiPromise: Map<string, Promise<VoidBallotAPI>> = new Map();

  constructor(private readonly logger: Logger) {}

  private getProviders() {
    return this.#providersPromise ?? (this.#providersPromise = initializeProviders(this.logger));
  }

  async join(contractAddress: string): Promise<VoidBallotAPI> {
    const existing = this.#apiPromise.get(contractAddress);
    if (existing) return existing;

    const promise = (async () => {
      const { providers } = await this.getProviders();
      return VoidBallotAPI.join(providers, contractAddress, getOrCreateSecrets());
    })();

    this.#apiPromise.set(contractAddress, promise);
    return promise;
  }

  async castBallot(contractAddress: string, choice: BallotChoice): Promise<void> {
    const api = await this.join(contractAddress);
    await api.castBallot(choice);
  }

  async proveVoted(contractAddress: string): Promise<void> {
    const api = await this.join(contractAddress);
    await api.proveVoted();
  }

  async getSession(): Promise<{
    unshieldedAddress: string;
    connectedAPI: ConnectedAPI;
  }> {
    const session = await this.getProviders();
    return {
      unshieldedAddress: session.unshieldedAddress,
      connectedAPI: session.connectedAPI,
    };
  }

  async disconnect(): Promise<void> {
    const session = await this.#providersPromise;
    if (session) {
      await (session.connectedAPI as { disconnect?: () => Promise<void> }).disconnect?.();
    }
    this.#providersPromise = undefined;
    this.#apiPromise.clear();
  }
}

export function friendlyError(error: unknown): string {
  const msg = extractErrorMessage(error);
  if (msg.includes('User rejected') || msg.includes('rejected by user')) {
    return 'You cancelled in the wallet. Nothing was sealed.';
  }
  if (msg.includes('already voted') || msg.includes('AlreadyVoted')) {
    return 'This seat already cast a ballot. One seal per citizen.';
  }
  if (msg.includes('no ballot cast') || msg.includes('NoBallot')) {
    return 'No sealed ballot found for you yet. Seal a position first.';
  }
  if (msg.includes('No private state found') || msg.includes('private state')) {
    return 'Your private seat wasn’t ready. Reconnect and try again.';
  }
  if (
    msg.includes('Failed to fetch') ||
    msg.includes('Failed Proof Server') ||
    msg.includes('proof server')
  ) {
    return 'Couldn’t reach the proving service. Check wallet network settings and try again.';
  }
  if (msg.includes('No Midnight wallet') || msg.includes('wallet found')) {
    return 'No Lace or 1AM wallet found. Install one, unlock it, and try again.';
  }
  if (msg.includes('not authorized') || msg.includes('Wallet not authorized')) {
    return 'Wallet connection was declined.';
  }
  if (msg.includes('insufficient') || msg.includes('DUST')) {
    return 'Not enough DUST to settle. Top up from the preview faucet.';
  }
  if (msg.includes('timeout') || msg.includes('Timeout')) {
    return 'That took too long. Unlock your wallet and try again.';
  }
  if (msg.includes('findDeployedContract') || msg.includes('Contract not found')) {
    return 'Couldn’t join the live floor. Check you’re on the right network.';
  }
  // Strip hex / circuit names if they dominate the message
  if (/0x[a-fA-F0-9]{16,}/.test(msg) || /castBallot|proveVoted/.test(msg)) {
    return 'Something went wrong sealing this action. Try again in a moment.';
  }
  return msg || 'Something went wrong. Try again in a moment.';
}

function extractErrorMessage(error: unknown): string {
  if (!error) return '';
  if (error instanceof Error && error.message) return error.message;
  const e = error as { cause?: { failure?: { message?: string; cause?: { message?: string } }; message?: string } };
  if (e.cause?.failure?.message) return e.cause.failure.message;
  if (e.cause?.failure?.cause?.message) return e.cause.failure.cause.message;
  if (e.cause?.message) return e.cause.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export { VoidBallotAPI };
