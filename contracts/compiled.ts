import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { witnesses } from './witnesses.js';
import { Contract } from './managed/void-ballot/contract/index.js';

/** Browser — relative asset path resolved by FetchZkConfigProvider. */
export const CompiledVoidBallotContract = CompiledContract.make(
  'VoidBallotContract',
  Contract,
).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets('./managed/void-ballot'),
);

export {
  Contract,
  ledger,
  pureCircuits,
  type Ledger,
  type ImpureCircuits,
  type PureCircuits,
} from './managed/void-ballot/contract/index.js';
