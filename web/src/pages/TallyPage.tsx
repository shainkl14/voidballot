import { motion, useReducedMotion } from 'motion/react';
import type { ChamberState } from '../lib/voidballot';

type Props = {
  contractAddress: string | null;
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
      <div className="h-3 w-full bg-slate">
        <motion.div
          className="h-full"
          style={{ background: accent }}
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

export function TallyPage({ contractAddress, chamber, onRefresh }: Props) {
  const total = chamber?.totalBallots ?? 0;

  return (
    <div className="mx-auto max-w-[900px] px-4 py-12 md:px-8 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Tally board</h1>
          <p className="mt-3 text-mist">Public counters. No voter names.</p>
        </div>
        <button
          type="button"
          onClick={() => void onRefresh()}
          className="border border-line px-4 py-2 text-sm text-paper transition hover:border-mist active:scale-[0.98]"
        >
          Refresh
        </button>
      </div>

      {!contractAddress && (
        <p className="mt-12 border border-line bg-ink p-8 text-mist">
          Join or deploy a chamber from the Ballot desk to read tallies.
        </p>
      )}

      {contractAddress && !chamber && (
        <p className="mt-12 animate-pulse font-mono text-sm text-mist">
          Waiting for indexed chamber state…
        </p>
      )}

      {chamber && (
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

          <dl className="space-y-3 font-mono text-[12px] text-mist">
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
              <dt className="shrink-0 text-paper/70">Proposal hash</dt>
              <dd className="break-all">{chamber.proposalHash}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
              <dt className="shrink-0 text-paper/70">Contract</dt>
              <dd className="break-all">{contractAddress}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
