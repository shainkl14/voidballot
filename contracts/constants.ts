/** Shared across deploy, CLI, tests, and browser — must stay in sync. */
export const voidBallotPrivateStateKey = 'voidBallotPrivateState' as const;
export type VoidBallotPrivateStateId = typeof voidBallotPrivateStateKey;
