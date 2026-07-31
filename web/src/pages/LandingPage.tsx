import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, EyeSlash, Scales, Seal } from '@phosphor-icons/react';
import { useProgress } from '../components/ProgressProvider';
import { liveChamber } from '../lib/chambers';

export function LandingPage() {
  const reduce = useReducedMotion();
  const { state } = useProgress();
  const live = liveChamber();
  const enterTo = state.onboarded ? '/home' : '/onboarding';

  return (
    <div>
      <section className="relative min-h-[100dvh] overflow-hidden">
        <img
          src="/chamber.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgba(7,9,10,0.92) 0%, rgba(7,9,10,0.78) 42%, rgba(7,9,10,0.45) 70%, rgba(7,9,10,0.55) 100%), radial-gradient(ellipse 60% 50% at 80% 30%, rgba(200,245,66,0.14), transparent 55%)',
          }}
        />
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] anim-grid-breathe" style={{
          backgroundImage:
            'linear-gradient(rgba(200,245,66,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(200,245,66,0.12) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }} />

        <div className="relative mx-auto flex min-h-[100dvh] max-w-[1400px] flex-col justify-end px-4 pb-20 pt-28 md:justify-center md:px-8 md:pb-24 md:pt-20">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="font-display text-5xl font-extrabold tracking-tight text-paper md:text-7xl lg:text-8xl"
          >
            Void<span className="text-acid">Ballot</span>
          </motion.p>
          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
            className="mt-6 max-w-[18ch] font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-paper md:text-5xl"
          >
            Cast in the void. Count in the light.
          </motion.h1>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-5 max-w-[40ch] text-base leading-relaxed text-paper/80 md:text-lg"
          >
            Anonymous civic ballots. Public tallies. No wallets named on the floor.
          </motion.p>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              to={enterTo}
              className="inline-flex items-center gap-2 bg-acid px-5 py-3 text-sm font-bold text-void transition hover:bg-acid-dim active:scale-[0.98]"
            >
              Enter chamber
              <ArrowRight size={16} weight="bold" />
            </Link>
            <Link
              to={`/floors/${live.id}/tally`}
              className="inline-flex items-center gap-2 border border-paper/25 px-5 py-3 text-sm font-medium text-paper transition hover:border-paper/50 active:scale-[0.98]"
            >
              Watch live tally
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-line py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8">
          <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-5xl">
            A chamber, not a console.
          </h2>
          <p className="mt-4 max-w-[48ch] text-mist">
            Built for citizens who care about the vote — not the circuit jargon underneath.
          </p>
          <div className="mt-14 grid grid-cols-1 gap-px bg-line md:grid-cols-3">
            {[
              {
                icon: EyeSlash,
                title: 'Identity stays dark',
                body: 'You vote once. The floor knows a ballot landed — not who you are.',
              },
              {
                icon: Scales,
                title: 'Tallies stay public',
                body: 'Aye, Nay, and Void update for everyone. Anyone can audit the count.',
              },
              {
                icon: Seal,
                title: 'Prove without naming',
                body: 'Show you participated without linking your wallet to a choice.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="bg-void p-8 md:p-10"
              >
                <item.icon size={28} weight="duotone" className="text-acid" />
                <h3 className="mt-6 font-display text-xl font-bold">{item.title}</h3>
                <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-mist">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-b border-line bg-ink py-20">
        <motion.div
          className="flex whitespace-nowrap font-display text-5xl font-extrabold tracking-tight text-paper/15 md:text-7xl"
          animate={reduce ? undefined : { x: ['0%', '-50%'] }}
          transition={reduce ? undefined : { duration: 32, ease: 'linear', repeat: Infinity }}
        >
          <span className="px-8">AYE / NAY / VOID / SEAL / TALLY / RETURN / </span>
          <span className="px-8">AYE / NAY / VOID / SEAL / TALLY / RETURN / </span>
        </motion.div>
      </section>

      <section className="py-24 md:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-end gap-12 px-4 md:grid-cols-2 md:px-8">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              Live floor is open.
            </h2>
            <p className="mt-4 max-w-[48ch] text-mist leading-relaxed">{live.summary}</p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link
              to={state.onboarded ? `/floors/${live.id}/vote` : '/onboarding'}
              className="inline-flex items-center gap-2 border border-acid px-5 py-3 text-sm font-bold text-acid transition hover:bg-acid hover:text-void active:scale-[0.98]"
            >
              Take the floor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
