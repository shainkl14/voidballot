import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';

export type VoidBallotPrivateState = {
  voterSecret: Uint8Array;
};

export const witnesses = {
  voterSecret: (context: WitnessContext<VoidBallotPrivateState>) =>
    [context.privateState, context.privateState.voterSecret] as const,
};

export function createInitialPrivateState(
  voterSecret: Uint8Array,
): VoidBallotPrivateState {
  return { voterSecret };
}
