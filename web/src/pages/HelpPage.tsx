import { Link } from 'react-router-dom';
import { ShieldCheck, LockKey, Broadcast, Warning, Question } from '@phosphor-icons/react';
import { liveChamber } from '../lib/chambers';

export function HelpPage() {
  const live = liveChamber();

  return (
    <div className="mx-auto max-w-[900px] px-4 py-16 md:px-8 md:py-24">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">Help & privacy</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
        How the chamber keeps you private
      </h1>
      <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-mist">
        VoidBallot is a civic floor on Midnight. Your ballot is sealed so the tally can stay public
        without naming who voted.
      </p>

      <div className="mt-14 space-y-10">
        <div className="border-t border-line pt-8">
          <div className="flex items-start gap-4">
            <LockKey size={24} className="mt-1 shrink-0 text-acid" weight="duotone" />
            <div>
              <h2 className="font-display text-xl font-bold">What stays private</h2>
              <ul className="mt-3 space-y-2 text-mist">
                <li>Your voter secret (kept in this browser)</li>
                <li>Any link between your Lace / 1AM wallet and your ballot</li>
                <li>Who cast which Aye, Nay, or Void</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-line pt-8">
          <div className="flex items-start gap-4">
            <Broadcast size={24} className="mt-1 shrink-0 text-acid" weight="duotone" />
            <div>
              <h2 className="font-display text-xl font-bold">What stays public</h2>
              <ul className="mt-3 space-y-2 text-mist">
                <li>Running Aye / Nay / Void counts and total ballots</li>
                <li>That a seat was used (so nobody votes twice)</li>
                <li>That the floor is open or sealed</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-line pt-8">
          <div className="flex items-start gap-4">
            <ShieldCheck size={24} className="mt-1 shrink-0 text-acid" weight="duotone" />
            <div>
              <h2 className="font-display text-xl font-bold">What you can do</h2>
              <ul className="mt-3 space-y-2 text-mist">
                <li>
                  <span className="text-paper">Seal a ballot</span> — cast once; the matching public
                  tally moves
                </li>
                <li>
                  <span className="text-paper">Prove I voted</span> — show you participated without
                  naming your wallet or choice
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-line pt-8">
          <div className="flex items-start gap-4">
            <Question size={24} className="mt-1 shrink-0 text-acid" weight="duotone" />
            <div>
              <h2 className="font-display text-xl font-bold">Wallets & waiting</h2>
              <ul className="mt-3 space-y-2 text-mist">
                <li>Use Lace or 1AM set to the same chamber network shown in Settings</li>
                <li>Proving can take up to a minute — keep the tab open</li>
                <li>Approve prompts in your wallet when they appear</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border border-ember/40 bg-ember/5 p-6">
          <div className="flex items-start gap-3">
            <Warning size={22} className="mt-0.5 shrink-0 text-ember" weight="fill" />
            <p className="text-sm leading-relaxed text-paper/90">
              Someone watching the live tally can see which count moved when you seal. They cannot
              map that ballot back to your wallet from chamber data alone.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-14 flex flex-wrap gap-3">
        <Link
          to={`/floors/${live.id}/vote`}
          className="inline-flex bg-acid px-5 py-3 text-sm font-bold text-void transition hover:bg-acid-dim active:scale-[0.98]"
        >
          Open ballot desk
        </Link>
        <Link
          to="/settings"
          className="inline-flex border border-line px-5 py-3 text-sm text-paper transition hover:border-mist"
        >
          Settings
        </Link>
      </div>
    </div>
  );
}
