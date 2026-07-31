import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import type { ChamberState } from '@api/common-types.js';
import { chamberById, liveChamber } from '../lib/chambers';
import { AdvancedDetails } from '../components/AdvancedDetails';
import { useProgress } from '../components/ProgressProvider';
import { CONTRACT_ADDRESS } from '../config';

type Props = {
  chamber: ChamberState | null;
  onRefresh: () => Promise<void>;
};

function Bar({
  label,
  value,
  total,
  accent,
}: {
  label: string;
  value: number;
  total: number;
  accent: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const reduce = useReducedMotion();
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-display text-lg font-bold">{label}</span>
        <span className="font-mono text-sm text-mist">
          {value} <span className="text-paper/50">({pct}%)</span>
        </span>
      </div>
      <div className="h-3 w-full bg-slate overflow-hidden">
        <motion.div
          className="h-full anim-tally-grow origin-left"
          style={{ background: accent }}
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: pct / 100 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

export function TallyPage({ chamber, onRefresh }: Props) {
  const { id } = useParams<{ id: string }>();
  const floor = id ? chamberById(id) : liveChamber();
  const { recordFloorVisit } = useProgress();
  const total = chamber?.totalBallots ?? 0;
  const isLive = floor?.status === 'live';

  useEffect(() => {
    if (isLive) recordFloorVisit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floor?.id]);

  if (!floor) return <Navigate to="/floors" replace />;

  return (
    <div className="mx-auto max-w-[900px] px-4 py-12 md:px-8 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">
            {floor.status === 'sealed' ? 'Archive tally' : 'Live tally'}
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">
            {floor.title}
          </h1>
          <p className="mt-3 text-mist">Public counters. No voter names.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isLive ? (
            <Link
              to={`/floors/${floor.id}/vote`}
              className="border border-acid px-4 py-2 text-sm font-bold text-acid transition hover:bg-acid hover:text-void active:scale-[0.98]"
            >
              Ballot desk
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => void onRefresh()}
            className="border border-line px-4 py-2 text-sm text-paper transition hover:border-mist active:scale-[0.98]"
          >
            Refresh
          </button>
        </div>
      </div>

      {!isLive && floor.status === 'upcoming' ? (
        <p className="mt-12 text-mist">This floor hasn’t opened. No live counters yet.</p>
      ) : null}

      {isLive && !chamber ? (
        <p className="mt-12 animate-pulse text-sm text-mist">Loading the board…</p>
      ) : null}

      {(isLive || floor.status === 'sealed') && chamber ? (
        <div className="mt-12 space-y-10">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Aye', value: chamber.votesAye },
              { label: 'Nay', value: chamber.votesNay },
              { label: 'Void', value: chamber.votesVoid },
              { label: 'Total', value: chamber.totalBallots },
            ].map((item) => (
              <div key={item.label} className="border border-line bg-ink p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-mist">
                  {item.label}
                </p>
                <p className="mt-2 font-display text-4xl font-extrabold text-acid">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-6 border border-line bg-ink p-6 md:p-8">
            <Bar label="Aye" value={chamber.votesAye} total={total} accent="#c8f542" />
            <Bar label="Nay" value={chamber.votesNay} total={total} accent="#ff6b4a" />
            <Bar label="Void" value={chamber.votesVoid} total={total} accent="#8b968f" />
          </div>

          <AdvancedDetails label="Technical details">
            <p>Proposal hash: {chamber.proposalHash || '—'}</p>
            <p>Contract: {CONTRACT_ADDRESS}</p>
          </AdvancedDetails>
        </div>
      ) : null}

      {floor.status === 'sealed' && !chamber ? (
        <p className="mt-12 text-mist">
          Archive floor — live indexer state unavailable. {floor.summary}
        </p>
      ) : null}
    </div>
  );
}
