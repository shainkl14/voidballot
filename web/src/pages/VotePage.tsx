import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { CircleNotch, CheckCircle } from '@phosphor-icons/react';
import type { ChamberState, BallotChoice } from '@api/common-types.js';
import {
  BrowserVoidBallotManager,
  friendlyError,
} from '../lib/BrowserVoidBallotManager';
import { CHOICE_LABELS, CONTRACT_ADDRESS } from '../config';
import { chamberById, liveChamber } from '../lib/chambers';
import { AdvancedDetails } from '../components/AdvancedDetails';
import { useProgress } from '../components/ProgressProvider';
import type { TxFlowState } from '../components/TxFlow';

type Props = {
  connected: boolean;
  busy: boolean;
  chamber: ChamberState | null;
  nullifierPreview: string;
  manager: BrowserVoidBallotManager;
  onBusy: (v: boolean) => void;
  onOpenConnect: () => void;
  onTxFlow: (flow: TxFlowState | ((prev: TxFlowState) => TxFlowState)) => void;
  onRefresh: () => Promise<void>;
  onToast: (tone: 'ok' | 'warn' | 'info', title: string, body?: string) => void;
};

export function VotePage({
  connected,
  busy,
  chamber,
  nullifierPreview,
  manager,
  onBusy,
  onOpenConnect,
  onTxFlow,
  onRefresh,
  onToast,
}: Props) {
  const { id } = useParams<{ id: string }>();
  const floor = id ? chamberById(id) : liveChamber();
  const { recordCast, recordVerify, recordFloorVisit } = useProgress();
  const [choice, setChoice] = useState<BallotChoice>(0);

  useEffect(() => {
    if (floor?.status === 'live') recordFloorVisit();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per floor open
  }, [floor?.id]);

  if (!floor) {
    return <Navigate to="/floors" replace />;
  }

  if (floor.status !== 'live') {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-16 md:px-8">
        <h1 className="font-display text-3xl font-extrabold">{floor.title}</h1>
        <p className="mt-4 text-mist">
          {floor.status === 'upcoming'
            ? 'This floor isn’t open for ballots yet.'
            : 'This floor is sealed. Tallies are read-only.'}
        </p>
        <Link
          to={floor.status === 'sealed' ? `/floors/${floor.id}/tally` : '/floors'}
          className="mt-8 inline-flex bg-acid px-4 py-2.5 text-sm font-bold text-void"
        >
          {floor.status === 'sealed' ? 'View tally' : 'Back to floors'}
        </Link>
      </div>
    );
  }

  async function runTx(
    action: string,
    successTitle: string,
    successDetail: string,
    work: () => Promise<void>,
    onSuccess: () => void,
  ) {
    onBusy(true);
    let settled = false;
    onTxFlow({
      open: true,
      phase: 'preparing',
      action,
      successTitle,
    });
    try {
      await delay(280);
      onTxFlow((f) => ({ ...f, phase: 'proving' }));
      const proving = work();
      const phaseTimer = window.setTimeout(() => {
        if (!settled) {
          onTxFlow((f) =>
            f.open && (f.phase === 'proving' || f.phase === 'preparing')
              ? { ...f, phase: 'confirming' }
              : f,
          );
        }
      }, 1400);
      try {
        await proving;
        settled = true;
        window.clearTimeout(phaseTimer);
        onTxFlow((f) => ({ ...f, phase: 'settling' }));
        await onRefresh();
        await delay(400);
        onTxFlow((f) => ({
          ...f,
          phase: 'success',
          successTitle,
          detail: successDetail,
        }));
        onSuccess();
        onToast('ok', successTitle, successDetail);
      } catch (inner) {
        settled = true;
        window.clearTimeout(phaseTimer);
        throw inner;
      }
    } catch (e) {
      const msg = friendlyError(e);
      onTxFlow((f) => ({
        ...f,
        phase: 'failure',
        error: msg,
      }));
      onToast('warn', 'Action didn’t complete', msg);
    } finally {
      onBusy(false);
    }
  }

  async function handleCast() {
    if (!connected) {
      onOpenConnect();
      return;
    }
    const label = CHOICE_LABELS[choice];
    await runTx(
      'Seal ballot',
      'Ballot sealed',
      `Your ${label} is on the public tally. Identity stays dark.`,
      () => manager.castBallot(CONTRACT_ADDRESS, choice),
      () => recordCast(label),
    );
  }

  async function handleProve() {
    if (!connected) {
      onOpenConnect();
      return;
    }
    await runTx(
      'Verify voice',
      'Voice verified',
      'You proved participation without naming your wallet or choice.',
      () => manager.proveVoted(CONTRACT_ADDRESS),
      () => recordVerify(),
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 py-12 md:px-8 md:py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">Ballot desk</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">{floor.title}</h1>
      <p className="mt-4 max-w-[55ch] text-lg leading-relaxed text-mist">{floor.question}</p>

      <section className="mt-10 border border-line bg-ink p-6 md:p-8">
        <h2 className="font-display text-xl font-bold">Your position</h2>
        <p className="mt-2 text-sm text-mist">
          Choose once. Sealing can take up to a minute while your private proof is built.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {([0, 1, 2] as BallotChoice[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChoice(c)}
              className={`min-h-[120px] border px-4 py-6 text-left transition active:scale-[0.99] ${
                choice === c
                  ? 'border-acid bg-acid text-void'
                  : 'border-line bg-void text-paper hover:border-mist'
              }`}
            >
              <span className="font-display text-3xl font-extrabold">{CHOICE_LABELS[c]}</span>
              <span
                className={`mt-2 block text-xs ${
                  choice === c ? 'text-void/70' : 'text-mist'
                }`}
              >
                {c === 0 ? 'Support' : c === 1 ? 'Oppose' : 'Abstain / unclear'}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {!connected ? (
            <button
              type="button"
              onClick={onOpenConnect}
              className="inline-flex items-center gap-2 bg-acid px-5 py-3 text-sm font-bold text-void transition hover:bg-acid-dim active:scale-[0.98]"
            >
              Connect to seal
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleCast()}
              className="inline-flex items-center gap-2 bg-acid px-5 py-3 text-sm font-bold text-void disabled:opacity-50 active:scale-[0.98]"
            >
              {busy ? <CircleNotch className="animate-spin" size={16} /> : null}
              Seal {CHOICE_LABELS[choice]}
            </button>
          )}
          <button
            type="button"
            disabled={busy || !connected}
            onClick={() => void handleProve()}
            className="inline-flex items-center gap-2 border border-line px-5 py-3 text-sm font-medium text-paper disabled:opacity-50 active:scale-[0.98]"
          >
            <CheckCircle size={16} />
            Prove I voted
          </button>
          <Link
            to={`/floors/${floor.id}/tally`}
            className="inline-flex items-center border border-line px-5 py-3 text-sm text-paper transition hover:border-mist"
          >
            Open tally
          </Link>
        </div>

        {chamber ? (
          <p className="mt-8 font-mono text-xs text-mist">
            Board now: {chamber.votesAye} Aye · {chamber.votesNay} Nay · {chamber.votesVoid} Void ·{' '}
            {chamber.totalBallots} total
          </p>
        ) : null}

        <AdvancedDetails label="Technical details">
          <p>Contract: {CONTRACT_ADDRESS}</p>
          <p>Nullifier preview: {nullifierPreview}</p>
        </AdvancedDetails>
      </section>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
