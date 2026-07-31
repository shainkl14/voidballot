import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { voidBallotPrivateStateKey } from '../../contracts/constants.js';
import type { VoidBallotPrivateState } from '../../contracts/witnesses.js';

export { voidBallotPrivateStateKey };

export type VoidBallotCircuitKeys = 'castBallot' | 'proveVoted';
export type VoidBallotProviders = MidnightProviders<
  VoidBallotCircuitKeys,
  typeof voidBallotPrivateStateKey,
  VoidBallotPrivateState
>;
export type DeployedVoidBallotContract = FoundContract<any>;

export type BallotChoice = 0 | 1 | 2;

export type ChamberState = {
  proposalHash: string;
  votesAye: number;
  votesNay: number;
  votesVoid: number;
  totalBallots: number;
};
