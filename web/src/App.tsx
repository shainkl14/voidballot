import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import pino from 'pino';
import { SiteNav } from './components/SiteNav';
import { LandingPage } from './pages/LandingPage';
import { VotePage } from './pages/VotePage';
import { TallyPage } from './pages/TallyPage';
import { PrivacyPage } from './pages/PrivacyPage';
import {
  BrowserVoidBallotManager,
  friendlyError,
  getOrCreateSecrets,
  VoidBallotAPI,
} from './lib/BrowserVoidBallotManager';
import { CONTRACT_ADDRESS, INDEXER_URL, NETWORK_ID } from './config';
import type { ChamberState } from '@api/common-types.js';

export default function App() {
  const managerRef = useRef<BrowserVoidBallotManager | null>(null);
  const [connected, setConnected] = useState(false);
  const [unshieldedAddress, setUnshieldedAddress] = useState<string | null>(null);
  const [chamber, setChamber] = useState<ChamberState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const secrets = useMemo(() => getOrCreateSecrets(), []);
  const nullifierPreview = useMemo(
    () => VoidBallotAPI.nullifierPreview(secrets),
    [secrets],
  );

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
      setError(null);
    } catch (e) {
      setError(friendlyError(e));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function onConnect() {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const manager = getManager();
      const session = await manager.getSession();
      await manager.join(CONTRACT_ADDRESS);
      setUnshieldedAddress(session.unshieldedAddress);
      setConnected(true);
      setStatus(`Connected on ${NETWORK_ID} — joined contract via findDeployedContract`);
    } catch (e) {
      setError(friendlyError(e));
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
    setStatus('Disconnected');
    setBusy(false);
  }

  return (
    <BrowserRouter>
      <div className="min-h-[100dvh] bg-void text-paper">
        <SiteNav
          connected={connected}
          address={unshieldedAddress}
          busy={busy}
          onConnect={() => void onConnect()}
          onDisconnect={() => void onDisconnect()}
        />
        {(error || status) && (
          <div
            className={`border-b px-4 py-2 text-center text-sm ${
              error
                ? 'border-ember/40 bg-ember/10 text-paper'
                : 'border-acid/30 bg-acid/10 text-paper'
            }`}
          >
            {error ?? status}
          </div>
        )}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/vote"
            element={
              <VotePage
                connected={connected}
                busy={busy}
                chamber={chamber}
                nullifierPreview={nullifierPreview}
                manager={getManager()}
                onBusy={setBusy}
                onError={setError}
                onStatus={setStatus}
                onRefresh={refresh}
              />
            }
          />
          <Route
            path="/tally"
            element={
              <TallyPage
                contractAddress={CONTRACT_ADDRESS}
                chamber={chamber}
                onRefresh={refresh}
              />
            }
          />
          <Route path="/privacy" element={<PrivacyPage />} />
        </Routes>
        <footer className="border-t border-line py-8 text-center font-mono text-[11px] text-mist">
          VoidBallot on Midnight — anonymous ballots, public tallies
        </footer>
      </div>
    </BrowserRouter>
  );
}
