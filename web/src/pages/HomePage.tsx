import { Link } from 'react-router-dom';
import { ArrowRight, Fire, TrendUp } from '@phosphor-icons/react';
import { useProgress } from '../components/ProgressProvider';
import { liveChamber } from '../lib/chambers';
import type { ChamberState } from '@api/common-types.js';

type Props = {
  chamber: ChamberState | null;
  connected: boolean;
  onOpenConnect: () => void;
};

export function HomePage({ chamber, connected, onOpenConnect }: Props) {
  const { state, rank } = useProgress();
  const live = liveChamber();
  const pct = Math.round(rank.progress * 100);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">Your standing</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
        {state.displayName}
      </h1>
      <p className="mt-3 max-w-[48ch] text-mist">
        {rank.current.blurb}
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="border border-line bg-ink p-5 md:col-span-2">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-mist">Rank</p>
              <p className="mt-1 font-display text-2xl font-bold text-acid">{rank.current.label}</p>
            </div>
            <p className="font-mono text-sm text-mist">{state.xp} XP</p>
          </div>
          <div className="mt-5 h-2 w-full bg-slate">
            <div
              className="h-full bg-acid transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 font-mono text-[11px] text-mist">
            {rank.next
              ? `${rank.next.minXp - state.xp} XP to ${rank.next.label}`
              : 'Top of the chamber'}
          </p>
        </div>

        <div className="border border-line bg-ink p-5">
          <div className="flex items-center gap-2 text-acid">
            <Fire size={20} weight="duotone" />
            <p className="font-mono text-[11px] uppercase tracking-[0.14em]">Streak</p>
          </div>
          <p className="mt-3 font-display text-4xl font-extrabold">
            {state.streak}
            <span className="ml-2 text-lg text-mist">day{state.streak === 1 ? '' : 's'}</span>
          </p>
          <p className="mt-2 text-xs text-mist">Return tomorrow to keep cadence.</p>
        </div>
      </div>

      <section className="mt-12 border border-acid/30 bg-ink p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-acid">Live floor</p>
            <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">{live.title}</h2>
            <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-mist">{live.summary}</p>
            {chamber ? (
              <p className="mt-4 inline-flex items-center gap-2 font-mono text-xs text-mist">
                <TrendUp size={14} className="text-acid" />
                {chamber.totalBallots} sealed ballots on the board
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {!connected ? (
              <button
                type="button"
                onClick={onOpenConnect}
                className="inline-flex items-center gap-2 border border-line px-4 py-2.5 text-sm text-paper transition hover:border-mist active:scale-[0.98]"
              >
                Connect first
              </button>
            ) : null}
            <Link
              to={`/floors/${live.id}/vote`}
              className="inline-flex items-center gap-2 bg-acid px-4 py-2.5 text-sm font-bold text-void transition hover:bg-acid-dim active:scale-[0.98]"
            >
              Take the floor
              <ArrowRight size={14} weight="bold" />
            </Link>
            <Link
              to={`/floors/${live.id}/tally`}
              className="inline-flex items-center gap-2 border border-line px-4 py-2.5 text-sm text-paper transition hover:border-mist active:scale-[0.98]"
            >
              Watch tally
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
