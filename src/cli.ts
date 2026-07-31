import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { WebSocket } from 'ws';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

import { VoidBallotAPI } from '../api/src/node.js';
import { CompiledVoidBallotContract, zkConfigPath } from '../contracts/index.js';
import { getConfig } from './config.js';
import { ensureDust } from './dust.js';
import { createProviders } from './providers.js';
import {
  createWallet,
  resolveDeploySeed,
  unshieldedToken,
  waitForSyncedWallet,
} from './wallet.js';
import { createInitialPrivateState } from '../contracts/witnesses.js';
import type { BallotChoice } from '../api/src/common-types.js';

// @ts-expect-error WebSocket global assignment for apollo
globalThis.WebSocket = WebSocket;

const VOTER_SECRET = new Uint8Array(32).fill(0x0a);

type DeploymentRecord = {
  network: string;
  contractAddress: string;
  proposal?: string;
  deployedAt: string;
};

function loadDeployment(): DeploymentRecord {
  const path = resolve(process.cwd(), 'deployment.json');
  if (!existsSync(path)) {
    throw new Error('No deployment.json found. Run yarn deploy:preview first.');
  }
  return JSON.parse(readFileSync(path, 'utf8')) as DeploymentRecord;
}

async function main() {
  const deployment = loadDeployment();
  if (!process.env['MIDNIGHT_NETWORK']) {
    process.env['MIDNIGHT_NETWORK'] =
      deployment.network === 'undeployed' ? 'local' : deployment.network;
  }

  const config = getConfig();
  const seed = resolveDeploySeed(config.networkId);
  setNetworkId(config.networkId);

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                 VoidBallot CLI                               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`  Contract: ${deployment.contractAddress}`);
  console.log(`  Network:  ${config.networkId}`);
  if (deployment.proposal) console.log(`  Proposal: ${deployment.proposal}`);
  console.log('');

  const rl = createInterface({ input: stdin, output: stdout });

  try {
    console.log('  Connecting to wallet...');
    const walletCtx = await createWallet(config, seed);
    console.log('  Syncing with network...');
    await waitForSyncedWallet(walletCtx.wallet, 600_000);
    console.log('  ✓ Synced\n');

    const state = await walletCtx.wallet.waitForSyncedState();
    console.log(`  Balance: ${(state.unshielded.balances[unshieldedToken().raw] ?? 0n).toLocaleString()} tNight`);
    console.log(`  DUST:    ${state.dust.balance(new Date()).toLocaleString()}\n`);

    await ensureDust(walletCtx);

    const privateState = createInitialPrivateState(VOTER_SECRET);
    const providers = createProviders(walletCtx, zkConfigPath, config, 'cli');
    const api = await VoidBallotAPI.join(
      providers,
      deployment.contractAddress,
      privateState,
      CompiledVoidBallotContract,
    );
    const nullifier = VoidBallotAPI.nullifierPreview(privateState);
    console.log(`  Nullifier preview: ${nullifier}\n`);

    let running = true;
    while (running) {
      console.log('─── Menu ───────────────────────────────────────────────────────');
      console.log('  1. Cast ballot (0=aye, 1=nay, 2=void)');
      console.log('  2. Prove voted');
      console.log('  3. Show chamber tally');
      console.log('  4. Exit\n');

      const choice = await rl.question('  Your choice: ');

      switch (choice.trim()) {
        case '1': {
          const ballotStr = await rl.question('  Choice (0/1/2): ');
          const ballot = Number(ballotStr.trim()) as BallotChoice;
          console.log('\n  Submitting castBallot...');
          try {
            await api.castBallot(ballot);
            console.log('\n  ✅ Ballot cast\n');
          } catch (error) {
            console.error('\n  ❌ Failed:', error instanceof Error ? error.message : error, '\n');
          }
          break;
        }
        case '2': {
          console.log('\n  Submitting proveVoted...');
          try {
            await api.proveVoted();
            console.log('\n  ✅ Vote proven (nullifier not disclosed)\n');
          } catch (error) {
            console.error('\n  ❌ Failed:', error instanceof Error ? error.message : error, '\n');
          }
          break;
        }
        case '3': {
          try {
            const chamber = await VoidBallotAPI.fetchChamberState(
              config.indexer,
              deployment.contractAddress,
              config.networkId as any,
            );
            console.log('\n  📊 Chamber tally');
            console.log(`  Aye:   ${chamber.votesAye}`);
            console.log(`  Nay:   ${chamber.votesNay}`);
            console.log(`  Void:  ${chamber.votesVoid}`);
            console.log(`  Total: ${chamber.totalBallots}\n`);
          } catch (error) {
            console.error('\n  ❌ Failed:', error instanceof Error ? error.message : error, '\n');
          }
          break;
        }
        case '4':
          running = false;
          break;
        default:
          console.log('\n  ❌ Invalid choice.\n');
      }
    }

    await walletCtx.wallet.stop();
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

main().catch(console.error);
