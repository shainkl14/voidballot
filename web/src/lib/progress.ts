/**
 * Local civic standing — retention loops without leaking identity on-chain.
 * Wallet link stays private; this is browser-local reputation.
 */

export type CivicRankId = 'observer' | 'member' | 'voice' | 'sentinel' | 'architect';

export type AchievementId =
  | 'first_steps'
  | 'sealed_ballot'
  | 'verified_voice'
  | 'floor_watcher'
  | 'streak_3'
  | 'streak_7'
  | 'returned_citizen';

export type HistoryEvent = {
  id: string;
  at: number;
  kind: 'onboarded' | 'connected' | 'cast' | 'verified' | 'visit_floor' | 'achievement';
  label: string;
  detail?: string;
};

export type ProgressState = {
  displayName: string;
  onboarded: boolean;
  xp: number;
  streak: number;
  lastVisitDay: string | null;
  ballotsCast: number;
  verifications: number;
  floorVisits: number;
  achievements: AchievementId[];
  history: HistoryEvent[];
  /** Soft preference: reduce motion-adjacent UI density */
  compactMode: boolean;
  /** Show developer details (addresses, hashes) */
  showAdvanced: boolean;
};

const STORAGE_KEY = 'voidballot-progress-v1';

export const RANKS: {
  id: CivicRankId;
  label: string;
  minXp: number;
  blurb: string;
}[] = [
  { id: 'observer', label: 'Observer', minXp: 0, blurb: 'Watching the floor. Not yet on record.' },
  { id: 'member', label: 'Member', minXp: 20, blurb: 'You joined a chamber. Standing begins.' },
  { id: 'voice', label: 'Voice', minXp: 60, blurb: 'A sealed ballot is on the ledger.' },
  { id: 'sentinel', label: 'Sentinel', minXp: 120, blurb: 'Verified participation. Trusted presence.' },
  { id: 'architect', label: 'Architect', minXp: 220, blurb: 'Habitual civic return. Chamber regular.' },
];

export const ACHIEVEMENTS: {
  id: AchievementId;
  title: string;
  blurb: string;
  xp: number;
}[] = [
  { id: 'first_steps', title: 'First steps', blurb: 'Finished chamber orientation.', xp: 15 },
  { id: 'sealed_ballot', title: 'Sealed ballot', blurb: 'Cast your first anonymous position.', xp: 40 },
  { id: 'verified_voice', title: 'Verified voice', blurb: 'Proved you voted — without naming yourself.', xp: 35 },
  { id: 'floor_watcher', title: 'Floor watcher', blurb: 'Checked the live tally three times.', xp: 20 },
  { id: 'streak_3', title: 'Three-day cadence', blurb: 'Returned three days in a row.', xp: 25 },
  { id: 'streak_7', title: 'Week on the floor', blurb: 'Seven-day return streak.', xp: 50 },
  { id: 'returned_citizen', title: 'Returned citizen', blurb: 'Came back after casting.', xp: 15 },
];

const defaultState = (): ProgressState => ({
  displayName: 'Anonymous delegate',
  onboarded: false,
  xp: 0,
  streak: 0,
  lastVisitDay: null,
  ballotsCast: 0,
  verifications: 0,
  floorVisits: 0,
  achievements: [],
  history: [],
  compactMode: false,
  showAdvanced: false,
});

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayDiff(a: string, b: string): number {
  const ms = Date.parse(b) - Date.parse(a);
  return Math.round(ms / 86_400_000);
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return { ...defaultState(), ...parsed, history: parsed.history?.slice(0, 40) ?? [] };
  } catch {
    return defaultState();
  }
}

export function saveProgress(state: ProgressState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function rankForXp(xp: number) {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (xp >= rank.minXp) current = rank;
  }
  const idx = RANKS.findIndex((r) => r.id === current.id);
  const next = RANKS[idx + 1] ?? null;
  const span = next ? next.minXp - current.minXp : 1;
  const into = next ? xp - current.minXp : span;
  const progress = next ? Math.min(1, into / span) : 1;
  return { current, next, progress };
}

function pushHistory(
  state: ProgressState,
  kind: HistoryEvent['kind'],
  label: string,
  detail?: string,
): ProgressState {
  const event: HistoryEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: Date.now(),
    kind,
    label,
    detail,
  };
  return { ...state, history: [event, ...state.history].slice(0, 40) };
}

function unlock(
  state: ProgressState,
  id: AchievementId,
): ProgressState {
  if (state.achievements.includes(id)) return state;
  const meta = ACHIEVEMENTS.find((a) => a.id === id);
  if (!meta) return state;
  let next = {
    ...state,
    achievements: [...state.achievements, id],
    xp: state.xp + meta.xp,
  };
  next = pushHistory(next, 'achievement', meta.title, meta.blurb);
  return next;
}

/** Call on app mount — maintains daily streak. */
export function recordVisit(state: ProgressState): ProgressState {
  const today = todayKey();
  if (state.lastVisitDay === today) return state;

  let streak = 1;
  if (state.lastVisitDay) {
    const diff = dayDiff(state.lastVisitDay, today);
    streak = diff === 1 ? state.streak + 1 : 1;
  }

  let next: ProgressState = {
    ...state,
    streak,
    lastVisitDay: today,
    xp: state.xp + 2,
  };
  next = pushHistory(next, 'visit_floor', 'Returned to the chamber', `Day streak: ${streak}`);

  if (streak >= 3) next = unlock(next, 'streak_3');
  if (streak >= 7) next = unlock(next, 'streak_7');
  if (state.ballotsCast > 0) next = unlock(next, 'returned_citizen');

  return next;
}

export function completeOnboarding(state: ProgressState, displayName: string): ProgressState {
  let next: ProgressState = {
    ...state,
    displayName: displayName.trim() || state.displayName,
    onboarded: true,
    xp: state.xp + 10,
  };
  next = pushHistory(next, 'onboarded', 'Orientation complete', next.displayName);
  next = unlock(next, 'first_steps');
  return next;
}

export function recordConnect(state: ProgressState): ProgressState {
  let next = { ...state, xp: state.xp + 8 };
  next = pushHistory(next, 'connected', 'Entered the chamber', 'Session linked');
  return next;
}

export function recordCast(state: ProgressState, choiceLabel: string): ProgressState {
  let next: ProgressState = {
    ...state,
    ballotsCast: state.ballotsCast + 1,
    xp: state.xp + 30,
  };
  next = pushHistory(next, 'cast', `Sealed ${choiceLabel}`, 'Anonymous ballot recorded');
  next = unlock(next, 'sealed_ballot');
  return next;
}

export function recordVerify(state: ProgressState): ProgressState {
  let next: ProgressState = {
    ...state,
    verifications: state.verifications + 1,
    xp: state.xp + 25,
  };
  next = pushHistory(next, 'verified', 'Voice verified', 'Participation proven privately');
  next = unlock(next, 'verified_voice');
  return next;
}

export function recordFloorVisit(state: ProgressState): ProgressState {
  const floorVisits = state.floorVisits + 1;
  let next: ProgressState = {
    ...state,
    floorVisits,
    xp: state.xp + (floorVisits <= 3 ? 3 : 0),
  };
  if (floorVisits === 1) {
    next = pushHistory(next, 'visit_floor', 'Opened the live floor');
  }
  if (floorVisits >= 3) next = unlock(next, 'floor_watcher');
  return next;
}

export function updateSettings(
  state: ProgressState,
  patch: Partial<Pick<ProgressState, 'displayName' | 'compactMode' | 'showAdvanced'>>,
): ProgressState {
  return { ...state, ...patch };
}

export function resetProgress(): ProgressState {
  const fresh = defaultState();
  saveProgress(fresh);
  return fresh;
}
