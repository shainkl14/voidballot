import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, EyeSlash, Scales, Fingerprint } from '@phosphor-icons/react';

export function LandingPage() {
  const reduce = useReducedMotion();

  return (
    <div>
      <section className="relative min-h-[100dvh] overflow-hidden border-b border-line">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 85% 20%, rgba(200,245,66,0.12), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(255,107,74,0.08), transparent 50%), linear-gradient(180deg, #07090a 0%, #0d1110 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(200,245,66,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(200,245,66,0.08) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse at 70% 30%, black 20%, transparent 70%)',
          }}
        />

        <div className="relative mx-auto grid max-w-[1400px] min-h-[100dvh] grid-cols-1 items-center gap-10 px-4 pb-16 pt-20 md:grid-cols-12 md:px-8 md:pt-16">
          <div className="md:col-span-7">
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-acid"
            >
              Civic midnight chamber
            </motion.p>
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-paper md:text-6xl lg:text-7xl"
            >
              Cast in the void.
              <br />
              <span className="text-acid">Count in the light.</span>
            </motion.h1>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="mt-6 max-w-[42ch] text-base leading-relaxed text-mist md:text-lg"
            >
              Anonymous ballots on Midnight. Your wallet stays shadowed. Tallies stay public and
              verifiable.
            </motion.p>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                to="/vote"
                className="inline-flex items-center gap-2 bg-acid px-5 py-3 text-sm font-bold text-void transition hover:bg-acid-dim active:scale-[0.98]"
              >
                Enter chamber
                <ArrowRight size={16} weight="bold" />
              </Link>
              <Link
                to="/privacy"
                className="inline-flex items-center gap-2 border border-line px-5 py-3 text-sm font-medium text-paper transition hover:border-mist active:scale-[0.98]"
              >
                How privacy works
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative md:col-span-5"
          >
            <div className="aspect-[4/5] w-full overflow-hidden border border-line bg-ink">
              <img
                src="/chamber.jpg"
                alt="Dim civic chamber corridor with acid-lime light cuts"
                className="h-full w-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-acid">
                  Nullifier chamber
                </p>
                <p className="mt-2 max-w-[28ch] text-sm text-paper/90">
                  One secret. One ballot. No second cast.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-line py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8">
          <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-5xl">
            Three signals. One chamber.
          </h2>
          <div className="mt-14 grid grid-cols-1 gap-px bg-line md:grid-cols-3">
            {[
              {
                icon: EyeSlash,
                title: 'Identity stays dark',
                body: 'A one-way nullifier proves you voted once. Lace and 1AM addresses never land on the ledger.',
              },
              {
                icon: Scales,
                title: 'Tallies stay public',
                body: 'Aye, Nay, and Void counters update on-chain. Anyone can audit the running count.',
              },
              {
                icon: Fingerprint,
                title: 'Prove without naming',
                body: 'proveVoted shows you cast a ballot. It does not attach your wallet to a choice.',
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
          transition={
            reduce
              ? undefined
              : { duration: 28, ease: 'linear', repeat: Infinity }
          }
        >
          <span className="px-8">AYE / NAY / VOID / NULLIFIER / TALLY / SEAL / </span>
          <span className="px-8">AYE / NAY / VOID / NULLIFIER / TALLY / SEAL / </span>
        </motion.div>
      </section>

      <section className="py-24 md:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-end gap-12 px-4 md:grid-cols-2 md:px-8">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              Built for local Midnight undeployed.
            </h2>
            <p className="mt-4 max-w-[48ch] text-mist leading-relaxed">
              Deploy a chamber, join an address, cast once, prove participation, seal when the vote
              closes. Node 22, Compact 0.31, Lace or 1AM.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link
              to="/tally"
              className="inline-flex items-center gap-2 border border-acid px-5 py-3 text-sm font-bold text-acid transition hover:bg-acid hover:text-void active:scale-[0.98]"
            >
              Open tally board
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
