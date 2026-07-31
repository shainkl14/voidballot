import { useState } from 'react';
import { CircleNotch, CheckCircle } from '@phosphor-icons/react';
import type { ChamberState, BallotChoice } from '@api/common-types.js';
import {
  BrowserVoidBallotManager,
  friendlyError,
} from '../lib/BrowserVoidBallotManager';
import { CHOICE_LABELS, CONTRACT_ADDRESS } from '../config';

type Props = {
  connected: boolean;
  busy: boolean;
  chamber: ChamberState | null;
  nullifierPreview: string;
  manager: BrowserVoidBallotManager;
  onBusy: (v: boolean) => void;
  onError: (e: string | null) => void;
  onStatus: (s: string | null) => void;
  onRefresh: () => Promise<void>;
};

export function VotePage({
  connected,
  busy,
  chamber,
  nullifierPreview,
  manager,
  onBusy,
  onError,
  onStatus,
  onRefresh,
}: Props) {
  const [choice, setChoice] = useState<BallotChoice>(0);

  async function handleCast() {
    if (!connected) {
      onError('Connect Lace or 1AM first.');
      return;
    }
    onBusy(true);
    onError(null);
    onStatus(`Proving castBallot (${CHOICE_LABELS[choice]})…`);
    try {
      await manager.castBallot(CONTRACT_ADDRESS, choice);
      onStatus(`Ballot cast: ${CHOICE_LABELS[choice]}`);
      await onRefresh();
    } catch (e) {
      onError(friendlyError(e));
      onStatus(null);
    } finally {
      onBusy(false);
    }
  }

  async function handleProve() {
    if (!connected) {
      onError('Connect Lace or 1AM first.');
      return;
    }
    onBusy(true);
    onError(null);
    onStatus('Proving proveVoted…');
    try {
      await manager.proveVoted(CONTRACT_ADDRESS);
      onStatus('Vote proven — nullifier on-chain, wallet identity hidden.');
    } catch (e) {
      onError(friendlyError(e));
      onStatus(null);
    } finally {
      onBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Ballot desk</h1>
      <p className="mt-3 max-w-[55ch] text-mist">
        Connect your wallet to join the preview chamber, then cast once from your nullifier.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <section className="border border-line bg-ink p-6 md:p-8">
          <h2 className="font-display text-xl font-bold">Chamber</h2>
          <p className="mt-4 font-mono text-[11px] text-mist break-all">
            Contract: {CONTRACT_ADDRESS}
          </p>
          <p className="mt-4 text-sm text-mist">
            {connected
              ? 'Wallet connected and contract joined via findDeployedContract.'
              : 'Use Connect in the nav to join this chamber.'}
          </p>
        </section>

        <section className="border border-line bg-ink p-6 md:p-8">
          <h2 className="font-display text-xl font-bold">Cast ballot</h2>
          <p className="mt-2 font-mono text-[11px] text-mist">
            Nullifier preview: {nullifierPreview.slice(0, 18)}…
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {([0, 1, 2] as BallotChoice[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChoice(c)}
                className={`border px-3 py-4 text-sm font-bold transition active:scale-[0.98] ${
                  choice === c
                    ? 'border-acid bg-acid text-void'
                    : 'border-line bg-void text-paper hover:border-mist'
                }`}
              >
                {CHOICE_LABELS[c]}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || !connected}
              onClick={() => void handleCast()}
              className="inline-flex items-center gap-2 bg-acid px-4 py-2.5 text-sm font-bold text-void disabled:opacity-50 active:scale-[0.98]"
            >
              {busy ? <CircleNotch className="animate-spin" size={16} /> : null}
              Cast {CHOICE_LABELS[choice]}
            </button>
            <button
              type="button"
              disabled={busy || !connected}
              onClick={() => void handleProve()}
              className="inline-flex items-center gap-2 border border-line px-4 py-2.5 text-sm font-medium text-paper disabled:opacity-50 active:scale-[0.98]"
            >
              <CheckCircle size={16} />
              Prove voted
            </button>
          </div>

          {chamber && (
            <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-line pt-6 font-mono text-sm">
              <div>
                <dt className="text-mist">Aye</dt>
                <dd className="mt-1 text-paper">{chamber.votesAye}</dd>
              </div>
              <div>
                <dt className="text-mist">Total</dt>
                <dd className="mt-1 text-paper">{chamber.totalBallots}</dd>
              </div>
            </dl>
          )}
        </section>
      </div>
    </div>
  );
}
