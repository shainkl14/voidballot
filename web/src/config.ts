import { setNetworkId, type NetworkId } from '@midnight-ntwrk/midnight-js-network-id';

/** Public app config — safe to commit (no secrets). Updated after preview deploy. */
export const APP_CONFIG = {
  networkId: 'preview' as const,
  contractAddress: '487486690e45ea44a5f75fc25b7c01f3d155977638a2556c37a667430fb9477a',
  indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
  indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
  zkAssetPath: '/zk/void-ballot',
} as const;

// Required before ledger decode, wallet connect, or any contract operation (preview network).
setNetworkId(APP_CONFIG.networkId as NetworkId);

export const NETWORK_ID = APP_CONFIG.networkId;
export const CONTRACT_ADDRESS = APP_CONFIG.contractAddress;
export const INDEXER_URL = APP_CONFIG.indexer;
export const ZK_ASSET_PATH = APP_CONFIG.zkAssetPath;
export const ZK_ASSET_ORIGIN =
  typeof window !== 'undefined'
    ? new URL(ZK_ASSET_PATH, window.location.origin).toString()
    : ZK_ASSET_PATH;

export const CHOICE_LABELS = {
  0: 'Aye',
  1: 'Nay',
  2: 'Void',
} as const;
