import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { witnesses } from './witnesses.js';

export {
  Contract,
  ledger,
  pureCircuits,
  type Ledger,
  type ImpureCircuits,
  type PureCircuits,
} from './managed/void-ballot/contract/index.js';
import { Contract } from './managed/void-ballot/contract/index.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const zkConfigPath = path.resolve(currentDir, 'managed', 'void-ballot');

export const CompiledVoidBallotContract = CompiledContract.make(
  'VoidBallotContract',
  Contract,
).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);
