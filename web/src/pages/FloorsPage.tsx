import { Link } from 'react-router-dom';
import { CHAMBERS, type ChamberStatus } from '../lib/chambers';

const STATUS_COPY: Record<ChamberStatus, string> = {
  live: 'Live',
  upcoming: 'Upcoming',
  sealed: 'Sealed',
};

const STATUS_CLASS: Record<ChamberStatus, string> = {
  live: 'text-acid border-acid/40',
  upcoming: 'text-mist border-line',
  sealed: 'text-ember/90 border-ember/30',
};

export function FloorsPage() {
  const ordered = [...CHAMBERS].sort((a, b) => {
    const order = { live: 0, upcoming: 1, sealed: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
      <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">Floors</h1>
      <p className="mt-3 max-w-[50ch] text-mist">
        Civic chambers in rotation. Only live floors accept sealed ballots today.
      </p>

      <ul className="mt-12 space-y-4">
        {ordered.map((floor) => (
          <li key={floor.id} className="border border-line bg-ink p-5 md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${STATUS_CLASS[floor.status]}`}
                  >
                    {STATUS_COPY[floor.status]}
                  </span>
                  <span className="font-mono text-[11px] text-mist">{floor.category}</span>
                  <span className="font-mono text-[11px] text-mist">{floor.closesLabel}</span>
                </div>
                <h2 className="mt-3 font-display text-2xl font-bold">{floor.title}</h2>
                <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-mist">{floor.summary}</p>
                <p className="mt-3 text-xs text-paper/70">{floor.stakes}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {floor.status === 'live' ? (
                  <>
                    <Link
                      to={`/floors/${floor.id}/vote`}
                      className="inline-flex bg-acid px-4 py-2.5 text-sm font-bold text-void transition hover:bg-acid-dim active:scale-[0.98]"
                    >
                      Ballot desk
                    </Link>
                    <Link
                      to={`/floors/${floor.id}/tally`}
                      className="inline-flex border border-line px-4 py-2.5 text-sm text-paper transition hover:border-mist active:scale-[0.98]"
                    >
                      Tally
                    </Link>
                  </>
                ) : floor.status === 'sealed' ? (
                  <Link
                    to={`/floors/${floor.id}/tally`}
                    className="inline-flex border border-line px-4 py-2.5 text-sm text-paper transition hover:border-mist active:scale-[0.98]"
                  >
                    View archive
                  </Link>
                ) : (
                  <span className="inline-flex border border-line px-4 py-2.5 text-sm text-mist">
                    Opens later
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
