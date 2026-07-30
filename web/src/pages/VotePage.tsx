import { useState } from 'react';
import { CircleNotch, CheckCircle } from '@phosphor-icons/react';
import type { ConnectedSession } from '../lib/midnight';
import {
  CHOICE_LABELS,
  castBallot,
  deployChamber,
  getNullifierPreview,
  getOrCreateSecrets,
  proveVoted,
  type BallotChoice,
  type ChamberState,
} from '../lib/voidballot';

type Props = {
  session: ConnectedSession | null;
  contractAddress: string | null;
  chamber: ChamberState | null;
  busy: boolean;
  error: string | null;
  onDeployed: (addr: string) => void;
  onJoined: (addr: string) => void;
  onBusy: (v: boolean) => void;
  onError: (e: string | null) => void;
  onRefresh: () => Promise<void>;
};

export function VotePage({
  session,
  contractAddress,
  chamber,
  busy,
  error,
  onDeployed,
  onJoined,
  onBusy,
  onError,
  onRefresh,
}: Props) {
  const [proposal, setProposal] = useState(
    'Chamber Measure: Seal the void corridor by midnight.',
  );
  const [joinInput, setJoinInput] = useState('');
  const [choice, setChoice] = useState<BallotChoice>(0);
  const secrets = getOrCreateSecrets();
  const nullifierPreview = getNullifierPreview(secrets);

  async function handleDeploy() {
    if (!session) {
      onError('Connect Lace or 1AM first.');
      return;
    }
    onBusy(true);
    onError(null);
    try {
      const addr = await deployChamber(session, proposal);
      onDeployed(addr);
      await onRefresh();
    } catch (e) {
      onError(String(e));
    } finally {
      onBusy(false);
    }
  }

  function handleJoin() {
    const addr = joinInput.trim();
    if (!/^[0-9a-fA-F]{64}$/.test(addr)) {
      onError('Contract address must be 64 hex characters.');
      return;
    }
    onJoined(addr);
    setJoinInput('');
    onError(null);
  }

  async function handleCast() {
    if (!session || !contractAddress) return;
    onBusy(true);
    onError(null);
    try {
      await castBallot(session, contractAddress, choice);
      await onRefresh();
    } catch (e) {
      onError(String(e));
    } finally {
      onBusy(false);
    }
  }

  async function handleProve() {
    if (!session || !contractAddress) return;
    onBusy(true);
    onError(null);
    try {
      await proveVoted(session, contractAddress);
      await onRefresh();
    } catch (e) {
      onError(String(e));
    } finally {
      onBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Ballot desk</h1>
      <p className="mt-3 max-w-[55ch] text-mist">
        Deploy a local chamber or join an existing address, then cast once from your nullifier.
      </p>

      {error && (
        <div className="mt-6 border border-ember/50 bg-ember/10 px-4 py-3 text-sm text-paper">
          {error}
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <section className="border border-line bg-ink p-6 md:p-8">
          <h2 className="font-display text-xl font-bold">Deploy / join</h2>
          <label className="mt-6 block">
            <span className="mb-2 block text-sm text-mist">Proposal text</span>
            <textarea
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              rows={3}
              className="w-full border border-line bg-void px-3 py-2 text-sm text-paper outline-none focus:border-acid"
            />
          </label>
          <button
            type="button"
            disabled={busy || !session}
            onClick={() => void handleDeploy()}
            className="mt-4 inline-flex items-center gap-2 bg-acid px-4 py-2.5 text-sm font-bold text-void transition hover:bg-acid-dim disabled:opacity-50 active:scale-[0.98]"
          >
            {busy ? <CircleNotch className="animate-spin" size={16} /> : null}
            Deploy chamber
          </button>

          <div className="mt-8 border-t border-line pt-6">
            <label className="block">
              <span className="mb-2 block text-sm text-mist">Join contract (64 hex)</span>
              <input
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                placeholder="contract address"
                className="w-full border border-line bg-void px-3 py-2 font-mono text-sm text-paper outline-none focus:border-acid"
              />
            </label>
            <button
              type="button"
              onClick={handleJoin}
              className="mt-3 border border-line px-4 py-2.5 text-sm font-medium text-paper transition hover:border-mist active:scale-[0.98]"
            >
              Join address
            </button>
          </div>

          {contractAddress && (
            <p className="mt-6 break-all font-mono text-[11px] text-mist">
              Active: {contractAddress}
            </p>
          )}
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
              disabled={busy || !session || !contractAddress}
              onClick={() => void handleCast()}
              className="inline-flex items-center gap-2 bg-acid px-4 py-2.5 text-sm font-bold text-void disabled:opacity-50 active:scale-[0.98]"
            >
              Cast {CHOICE_LABELS[choice]}
            </button>
            <button
              type="button"
              disabled={busy || !session || !contractAddress}
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
