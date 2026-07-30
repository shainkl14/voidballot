import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type MidnightWalletProvider } from './wallet.js';
import { type NetworkConfig } from './config.js';

export type VoidBallotCircuits =
  | 'castBallot'
  | 'proveVoted';

export type VoidBallotProviders = MidnightProviders<VoidBallotCircuits>;

export function buildProviders(
  wallet: MidnightWalletProvider,
  zkConfigPath: string,
  config: NetworkConfig,
  storeSuffix = `${Date.now()}`,
): VoidBallotProviders {
  const zkConfigProvider = new NodeZkConfigProvider<VoidBallotCircuits>(
    zkConfigPath,
  );

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: `void-ballot-${storeSuffix}`,
      walletProvider: wallet,
      privateStoragePasswordProvider: () => 'vB7#kL4$mN9@qR2!wX6*',
      accountId: `voidballot-account-${storeSuffix}`,
    }),
    publicDataProvider: indexerPublicDataProvider(
      config.indexer,
      config.indexerWS,
    ),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(
      config.proofServer,
      zkConfigProvider,
    ),
    walletProvider: wallet,
    midnightProvider: wallet,
  };
}
