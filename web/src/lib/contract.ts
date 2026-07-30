import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { witnesses } from '@contracts/witnesses.js';

export {
  Contract,
  ledger,
  pureCircuits,
} from '@contracts/managed/void-ballot/contract/index.js';
import { Contract } from '@contracts/managed/void-ballot/contract/index.js';

export const ZK_ASSET_PATH = '/zk/void-ballot';

export const CompiledVoidBallotContract = CompiledContract.make(
  'VoidBallotContract',
  Contract,
).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(ZK_ASSET_PATH),
);
