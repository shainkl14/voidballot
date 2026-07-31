import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  completeOnboarding,
  loadProgress,
  rankForXp,
  recordCast,
  recordConnect,
  recordFloorVisit,
  recordVerify,
  recordVisit,
  resetProgress,
  saveProgress,
  updateSettings,
  type ProgressState,
} from '../lib/progress';

type ProgressContextValue = {
  state: ProgressState;
  rank: ReturnType<typeof rankForXp>;
  completeOnboarding: (displayName: string) => void;
  recordConnect: () => void;
  recordCast: (choiceLabel: string) => void;
  recordVerify: () => void;
  recordFloorVisit: () => void;
  updateSettings: (
    patch: Partial<Pick<ProgressState, 'displayName' | 'compactMode' | 'showAdvanced'>>,
  ) => void;
  resetLocalData: () => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(() => loadProgress());

  useEffect(() => {
    setState((prev) => {
      const next = recordVisit(prev);
      if (next !== prev) saveProgress(next);
      return next;
    });
  }, []);

  useEffect(() => {
    saveProgress(state);
  }, [state]);

  const mutate = useCallback((fn: (s: ProgressState) => ProgressState) => {
    setState((prev) => fn(prev));
  }, []);

  const value = useMemo<ProgressContextValue>(
    () => ({
      state,
      rank: rankForXp(state.xp),
      completeOnboarding: (displayName) => mutate((s) => completeOnboarding(s, displayName)),
      recordConnect: () => mutate((s) => recordConnect(s)),
      recordCast: (choiceLabel) => mutate((s) => recordCast(s, choiceLabel)),
      recordVerify: () => mutate((s) => recordVerify(s)),
      recordFloorVisit: () => mutate((s) => recordFloorVisit(s)),
      updateSettings: (patch) => mutate((s) => updateSettings(s, patch)),
      resetLocalData: () => setState(resetProgress()),
    }),
    [state, mutate],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
