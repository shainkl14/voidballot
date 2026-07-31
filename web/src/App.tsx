import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import pino from 'pino';
import { AppChrome } from './components/AppChrome';
import { ConnectWalletModal } from './components/ConnectWalletModal';
import { ProgressProvider, useProgress } from './components/ProgressProvider';
import { RequireOnboarded } from './components/RequireOnboarded';
import { ToastProvider, useToasts } from './components/StatusToasts';
import { idleTxFlow, TxFlow, type TxFlowState } from './components/TxFlow';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { FloorsPage } from './pages/FloorsPage';
import { VotePage } from './pages/VotePage';
import { TallyPage } from './pages/TallyPage';
import { ActivityPage } from './pages/ActivityPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';
import {
  BrowserVoidBallotManager,
  friendlyError,
  getOrCreateSecrets,
  VoidBallotAPI,
} from './lib/BrowserVoidBallotManager';
import { CONTRACT_ADDRESS, INDEXER_URL, NETWORK_ID } from './config';
import { liveChamber } from './lib/chambers';
import { networkLabel } from './lib/networkLabels';
import type { ChamberState } from '@api/common-types.js';

function LiveVoteRedirect() {
  return <Navigate to={`/floors/${liveChamber().id}/vote`} replace />;
}

function LiveTallyRedirect() {
  return <Navigate to={`/floors/${liveChamber().id}/tally`} replace />;
}

function AppShell() {
  const location = useLocation();
  const { state, recordConnect } = useProgress();
  const { push } = useToasts();

  const managerRef = useRef<BrowserVoidBallotManager | null>(null);
  const [connected, setConnected] = useState(false);
  const [unshieldedAddress, setUnshieldedAddress] = useState<string | null>(null);
  const [chamber, setChamber] = useState<ChamberState | null>(null);
  const [busy, setBusy] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [txFlow, setTxFlow] = useState<TxFlowState>(idleTxFlow);

  const secrets = useMemo(() => getOrCreateSecrets(), []);
  const nullifierPreview = useMemo(
    () => VoidBallotAPI.nullifierPreview(secrets),
    [secrets],
  );

  const bareChrome =
    location.pathname === '/' || location.pathname === '/onboarding';

  const getManager = useCallback(() => {
    if (!managerRef.current) {
      const logger = pino({ level: 'warn', browser: { asObject: true } });
      managerRef.current = new BrowserVoidBallotManager(logger);
    }
    return managerRef.current;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const state = await VoidBallotAPI.fetchChamberState(
        INDEXER_URL,
        CONTRACT_ADDRESS,
        NETWORK_ID,
      );
      setChamber(state);
    } catch {
      // Quiet refresh failures — avoid jargon banners on every poll miss
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    document.documentElement.classList.toggle('compact', state.compactMode);
  }, [state.compactMode]);

  async function onConnect() {
    setBusy(true);
    try {
      const manager = getManager();
      const session = await manager.getSession();
      await manager.join(CONTRACT_ADDRESS);
      setUnshieldedAddress(session.unshieldedAddress);
      setConnected(true);
      setConnectOpen(false);
      recordConnect();
      push({
        tone: 'ok',
        title: 'You’re in the chamber',
        body: `Connected on ${networkLabel(NETWORK_ID)}.`,
      });
    } catch (e) {
      push({
        tone: 'warn',
        title: 'Couldn’t connect',
        body: friendlyError(e),
      });
    } finally {
      setBusy(false);
    }
  }

  async function onDisconnect() {
    setBusy(true);
    try {
      await getManager().disconnect();
    } catch {
      // ignore disconnect errors
    }
    setConnected(false);
    setUnshieldedAddress(null);
    setBusy(false);
    push({ tone: 'info', title: 'Left the chamber' });
  }

  return (
    <div className="min-h-[100dvh] bg-void text-paper">
      <AppChrome
        bare={bareChrome}
        connected={connected}
        busy={busy}
        onOpenConnect={() => setConnectOpen(true)}
        onDisconnect={() => void onDisconnect()}
      />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          path="/home"
          element={
            <RequireOnboarded>
              <HomePage
                chamber={chamber}
                connected={connected}
                onOpenConnect={() => setConnectOpen(true)}
              />
            </RequireOnboarded>
          }
        />
        <Route path="/floors" element={<FloorsPage />} />
        <Route
          path="/floors/:id/vote"
          element={
            <RequireOnboarded>
              <VotePage
                connected={connected}
                busy={busy}
                chamber={chamber}
                nullifierPreview={nullifierPreview}
                manager={getManager()}
                onBusy={setBusy}
                onOpenConnect={() => setConnectOpen(true)}
                onTxFlow={setTxFlow}
                onRefresh={refresh}
                onToast={(tone, title, body) => push({ tone, title, body })}
              />
            </RequireOnboarded>
          }
        />
        <Route path="/floors/:id/tally" element={<TallyPage chamber={chamber} onRefresh={refresh} />} />
        <Route
          path="/activity"
          element={
            <RequireOnboarded>
              <ActivityPage />
            </RequireOnboarded>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireOnboarded>
              <ProfilePage />
            </RequireOnboarded>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireOnboarded>
              <SettingsPage />
            </RequireOnboarded>
          }
        />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/privacy" element={<Navigate to="/help" replace />} />
        <Route path="/vote" element={<LiveVoteRedirect />} />
        <Route path="/tally" element={<LiveTallyRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!bareChrome ? (
        <footer className="border-t border-line py-8 text-center text-[11px] text-mist">
          VoidBallot — anonymous ballots, public tallies
          {state.showAdvanced && unshieldedAddress ? (
            <span className="mt-2 block font-mono opacity-70">
              Session {unshieldedAddress.slice(0, 8)}…{unshieldedAddress.slice(-4)}
            </span>
          ) : null}
        </footer>
      ) : null}

      <ConnectWalletModal
        open={connectOpen}
        busy={busy}
        onClose={() => setConnectOpen(false)}
        onConnect={() => void onConnect()}
      />
      <TxFlow flow={txFlow} onClose={() => setTxFlow(idleTxFlow())} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ProgressProvider>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </ProgressProvider>
    </BrowserRouter>
  );
}
