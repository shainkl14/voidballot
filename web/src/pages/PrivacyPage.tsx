import { Link } from 'react-router-dom';
import { ShieldCheck, LockKey, Broadcast, Warning } from '@phosphor-icons/react';

export function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 py-16 md:px-8 md:py-24">
      <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
        Privacy claim
      </h1>
      <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-mist">
        VoidBallot hides voter identity behind a one-way nullifier. Tallies remain public so the
        chamber stays auditable.
      </p>

      <div className="mt-14 space-y-10">
        <div className="border-t border-line pt-8">
          <div className="flex items-start gap-4">
            <LockKey size={24} className="mt-1 shrink-0 text-acid" weight="duotone" />
            <div>
              <h2 className="font-display text-xl font-bold">Private</h2>
              <ul className="mt-3 space-y-2 text-mist">
                <li>Voter secret (local private state / witness)</li>
                <li>Link between Lace / 1AM wallet and nullifier</li>
                <li>Any named attribution of who cast which ballot</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-line pt-8">
          <div className="flex items-start gap-4">
            <Broadcast size={24} className="mt-1 shrink-0 text-acid" weight="duotone" />
            <div>
              <h2 className="font-display text-xl font-bold">Public</h2>
              <ul className="mt-3 space-y-2 text-mist">
                <li>Proposal hash</li>
                <li>Used nullifiers (anti-double-vote set)</li>
                <li>Aggregate Aye / Nay / Void counters and total ballots</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-line pt-8">
          <div className="flex items-start gap-4">
            <ShieldCheck size={24} className="mt-1 shrink-0 text-acid" weight="duotone" />
            <div>
              <h2 className="font-display text-xl font-bold">Circuits</h2>
              <ul className="mt-3 space-y-2 text-mist">
                <li>
                  <span className="font-mono text-paper">castBallot</span> - spend a nullifier,
                  increment the matching public tally
                </li>
                <li>
                  <span className="font-mono text-paper">proveVoted</span> - prove your nullifier is
                  in the set without naming your wallet
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border border-ember/40 bg-ember/5 p-6">
          <div className="flex items-start gap-3">
            <Warning size={22} className="mt-0.5 shrink-0 text-ember" weight="fill" />
            <p className="text-sm leading-relaxed text-paper/90">
              Compact requires disclosed choice when branching into public counters. Per-transaction
              observers can see which tally moved. What they cannot do is map that nullifier back to
              your wallet from chain data alone.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-14">
        <Link
          to="/vote"
          className="inline-flex bg-acid px-5 py-3 text-sm font-bold text-void transition hover:bg-acid-dim active:scale-[0.98]"
        >
          Back to ballot
        </Link>
      </div>
    </div>
  );
}
