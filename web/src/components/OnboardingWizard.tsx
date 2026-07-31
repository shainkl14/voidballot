import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, EyeSlash, Scales, Seal } from '@phosphor-icons/react';
import { useProgress } from './ProgressProvider';

type Props = {
  onComplete: () => void;
};

const STEPS = [
  {
    id: 'what',
    icon: Scales,
    title: 'What VoidBallot is',
    body: 'A civic chamber on Midnight. You take a position — Aye, Nay, or Void — and the floor publishes a running tally anyone can check.',
  },
  {
    id: 'private',
    icon: EyeSlash,
    title: 'What stays private',
    body: 'Your name, wallet, and which person cast which ballot stay sealed. The chamber only learns that a valid ballot was counted once.',
  },
  {
    id: 'do',
    icon: Seal,
    title: 'What you’ll do',
    body: 'Connect once, seal a ballot on a live floor, optionally prove you participated — without revealing your choice or identity.',
  },
] as const;

export function OnboardingWizard({ onComplete }: Props) {
  const { completeOnboarding, state } = useProgress();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(state.displayName === 'Anonymous delegate' ? '' : state.displayName);
  const reduce = useReducedMotion();
  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  function finish() {
    completeOnboarding(name.trim() || 'Anonymous delegate');
    onComplete();
  }

  return (
    <div className="mx-auto max-w-[640px] px-4 py-12 md:px-8 md:py-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-acid">
        Orientation · {String(step + 1).padStart(2, '0')} / 03
      </p>

      <motion.div
        key={current.id}
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-8"
      >
        <current.icon size={36} weight="duotone" className="text-acid" />
        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
          {current.title}
        </h1>
        <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-mist">{current.body}</p>
      </motion.div>

      {last ? (
        <label className="mt-10 block">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-mist">
            Display name (local only)
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Anonymous delegate"
            maxLength={40}
            className="mt-2 w-full border border-line bg-ink px-4 py-3 text-sm text-paper outline-none transition focus:border-acid"
          />
          <span className="mt-2 block text-xs text-mist">
            Stored in this browser. Never sent to the ledger.
          </span>
        </label>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="inline-flex items-center gap-2 border border-line px-4 py-2.5 text-sm text-paper transition hover:border-mist active:scale-[0.98]"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        ) : null}
        {!last ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="inline-flex items-center gap-2 bg-acid px-5 py-2.5 text-sm font-bold text-void transition hover:bg-acid-dim active:scale-[0.98]"
          >
            Continue
            <ArrowRight size={14} weight="bold" />
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            className="inline-flex items-center gap-2 bg-acid px-5 py-2.5 text-sm font-bold text-void transition hover:bg-acid-dim active:scale-[0.98]"
          >
            Enter chamber
            <ArrowRight size={14} weight="bold" />
          </button>
        )}
      </div>

      <div className="mt-12 flex gap-2">
        {STEPS.map((s, i) => (
          <span
            key={s.id}
            className={`h-1 flex-1 transition ${i <= step ? 'bg-acid' : 'bg-line'}`}
          />
        ))}
      </div>
    </div>
  );
}
