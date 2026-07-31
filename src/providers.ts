import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';

import { type NetworkConfig } from './config.js';
import { type WalletContext } from './wallet.js';

export type VoidBallotCircuits = 'castBallot' | 'proveVoted';
export type VoidBallotProviders = MidnightProviders<VoidBallotCircuits>;

export function createProviders(
  walletCtx: WalletContext,
  zkConfigPath: string,
  networkConfig: NetworkConfig,
  storeSuffix = `${Date.now()}`,
): VoidBallotProviders {
  const zkConfigProvider = new NodeZkConfigProvider<VoidBallotCircuits>(zkConfigPath);
  const accountId = walletCtx.unshieldedKeystore.getBech32Address().toString();

  const walletProvider = {
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        {
          shieldedSecretKeys: walletCtx.shieldedSecretKeys,
          dustSecretKey: walletCtx.dustSecretKey,
        },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      return walletCtx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: `void-ballot-${storeSuffix}`,
      privateStoragePasswordProvider: () => 'vB7#kL4$mN9@qR2!wX6*',
      accountId,
    }),
    publicDataProvider: indexerPublicDataProvider(
      networkConfig.indexer,
      networkConfig.indexerWS,
    ),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}
