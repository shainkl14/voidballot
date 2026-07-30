import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SiteNav } from './components/SiteNav';
import { LandingPage } from './pages/LandingPage';
import { VotePage } from './pages/VotePage';
import { TallyPage } from './pages/TallyPage';
import { PrivacyPage } from './pages/PrivacyPage';
import {
  createConnectedSession,
  detectWallet,
  type ConnectedSession,
} from './lib/midnight';
import {
  CONTRACT_STORAGE_KEY,
  ZK_PATH,
  fetchChamberState,
  type ChamberState,
} from './lib/voidballot';
import { LOCAL_INDEXER, NETWORK_ID } from './lib/network';

export default function App() {
  const [session, setSession] = useState<ConnectedSession | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [chamber, setChamber] = useState<ChamberState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONTRACT_STORAGE_KEY);
    if (stored) setContractAddress(stored);
  }, []);

  const refresh = useCallback(async () => {
    if (!contractAddress) {
      setChamber(null);
      return;
    }
    const indexerUrl = session?.config.indexerUri ?? LOCAL_INDEXER;
    try {
      const state = await fetchChamberState(indexerUrl, contractAddress);
      setChamber(state);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, [contractAddress, session]);

  useEffect(() => {
    void refresh();
    if (!contractAddress) return;
    const interval = setInterval(() => void refresh(), 15_000);
    return () => clearInterval(interval);
  }, [refresh, contractAddress]);

  async function onConnect() {
    setBusy(true);
    setError(null);
    try {
      const wallet = await detectWallet();
      const api = await wallet.connect(NETWORK_ID);
      setSession(await createConnectedSession(api, ZK_PATH));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onDisconnect() {
    if (session?.api?.disconnect) await session.api.disconnect();
    setSession(null);
  }

  function persistAddress(addr: string) {
    setContractAddress(addr);
    localStorage.setItem(CONTRACT_STORAGE_KEY, addr);
  }

  return (
    <BrowserRouter>
      <div className="min-h-[100dvh] bg-void text-paper">
        <SiteNav
          connected={!!session}
          address={session?.unshieldedAddress ?? null}
          busy={busy}
          onConnect={() => void onConnect()}
          onDisconnect={() => void onDisconnect()}
        />
        {error && (
          <div className="border-b border-ember/40 bg-ember/10 px-4 py-2 text-center text-sm text-paper">
            {error}
          </div>
        )}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/vote"
            element={
              <VotePage
                session={session}
                contractAddress={contractAddress}
                chamber={chamber}
                busy={busy}
                error={error}
                onDeployed={persistAddress}
                onJoined={persistAddress}
                onBusy={setBusy}
                onError={setError}
                onRefresh={refresh}
              />
            }
          />
          <Route
            path="/tally"
            element={
              <TallyPage
                contractAddress={contractAddress}
                chamber={chamber}
                onRefresh={refresh}
              />
            }
          />
          <Route path="/privacy" element={<PrivacyPage />} />
        </Routes>
        <footer className="border-t border-line py-8 text-center font-mono text-[11px] text-mist">
          VoidBallot on Midnight - anonymous ballots, public tallies
        </footer>
      </div>
    </BrowserRouter>
  );
}
