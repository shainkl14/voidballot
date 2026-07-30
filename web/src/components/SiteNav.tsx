import { NavLink } from 'react-router-dom';
import { CircleNotch, Wallet, SignOut } from '@phosphor-icons/react';

const links = [
  { to: '/', label: 'Chamber', end: true },
  { to: '/vote', label: 'Ballot' },
  { to: '/tally', label: 'Tally' },
  { to: '/privacy', label: 'Privacy' },
];

type Props = {
  connected: boolean;
  address: string | null;
  busy: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
};

function trunc(addr: string) {
  return addr.length > 14 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

export function SiteNav({
  connected,
  address,
  busy,
  onConnect,
  onDisconnect,
}: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-void/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-8">
        <NavLink to="/" className="font-display text-lg font-800 tracking-tight text-paper">
          Void<span className="text-acid">Ballot</span>
        </NavLink>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `font-mono text-[12px] uppercase tracking-[0.14em] transition-colors ${
                  isActive ? 'text-acid' : 'text-mist hover:text-paper'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {connected ? (
            <>
              <span className="hidden font-mono text-[11px] text-mist sm:inline">
                {address ? trunc(address) : 'connected'}
              </span>
              <button
                type="button"
                onClick={onDisconnect}
                disabled={busy}
                className="inline-flex items-center gap-2 border border-line bg-slate px-3 py-2 text-[12px] font-medium text-paper transition active:scale-[0.98] hover:border-mist disabled:opacity-50"
              >
                <SignOut size={14} weight="bold" />
                Disconnect
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              disabled={busy}
              className="inline-flex items-center gap-2 bg-acid px-3 py-2 text-[12px] font-bold text-void transition active:scale-[0.98] hover:bg-acid-dim disabled:opacity-50"
            >
              {busy ? (
                <CircleNotch size={14} className="animate-spin" />
              ) : (
                <Wallet size={14} weight="bold" />
              )}
              Connect wallet
            </button>
          )}
        </div>
      </div>

      <nav className="flex gap-4 overflow-x-auto border-t border-line/60 px-4 py-2 md:hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] ${
                isActive ? 'text-acid' : 'text-mist'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
