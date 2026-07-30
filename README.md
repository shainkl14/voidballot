# VoidBallot

Anonymous chamber voting on [Midnight Network](https://midnight.network). Voters cast ballots behind a one-way nullifier. Aggregate Aye / Nay / Void tallies stay public and auditable.

## Privacy claim

| Data | Visibility |
|------|------------|
| Voter secret | **Private** (witness + local private state) |
| Wallet - nullifier link | **Private** |
| Nullifier set | **Public** (prevents double voting) |
| Proposal hash | **Public** |
| Aye / Nay / Void counters | **Public** |

**Observable privacy:** an observer can verify tallies and see that a nullifier voted. They cannot recover which Lace or 1AM wallet owns that nullifier from chain data alone.

Compact requires disclosed choice when branching into public counters, so per-transaction observers can see which tally moved. Identity attribution remains private.

## Circuits

- `castBallot(choice)` - spend nullifier, increment public tally
- `proveVoted()` - prove your nullifier is in the set

## Prerequisites

- **Node.js 22+**
- **Docker** (local devnet + proof server)
- **Compact compiler** 0.31.1
- **Yarn 1.22**
- Lace or 1AM browser wallet (for the web UI)

## Setup

```bash
nvm use 22
yarn install
yarn compile
yarn env:up
yarn test:local
```

Or one shot:

```bash
yarn setup:l1
```

If port 6300 is already in use, `yarn env:up` starts node + indexer only. Keep a proof server at `http://127.0.0.1:6300`.

## Deploy (undeployed)

```bash
yarn env:up
yarn deploy:undeployed
```

Uses the pre-funded genesis wallet. Address is written to `deployment.json`.

Current undeployed address:

`462b8dfdb0fe64c1a5d27439e4633127aebdecebd122890ae53922c69e488199`

## Web UI

```bash
yarn web:install
yarn web:dev
```

Open `http://127.0.0.1:3010`. Connect Lace / 1AM on undeployed, deploy or join a chamber, cast a ballot, watch the tally board.

```bash
yarn sync:zk    # copy managed ZK assets into web/public
yarn web:build
```

## Scripts

| Script | Purpose |
|--------|---------|
| `yarn compile` | Compact compile (+ ZK) |
| `yarn compile:fast` | Compile skipping ZK keys |
| `yarn env:up` | Local node + indexer |
| `yarn deploy:undeployed` | Deploy chamber |
| `yarn test:local` | Integration tests |
| `yarn sync:zk` | Sync ZK assets to web |
| `yarn web:dev` | Vite app on :3010 |

## Preprod

Skipped for this milestone. Use undeployed local only.

## Known local note

`yarn env:up` may fail if ports 9944/8088/6300 are already taken by another Midnight project; reuse that shared undeployed stack.

Full ZK compile needs Midnight BLS params under `~/.cache/midnight/zk-params/`. This project targets circuits that fit cached param sizes already present on typical L2 workstations (`2p13`+). If keygen fails fetching a missing `bls_midnight_2p*`, run `yarn compile:fast` first, restore network access to Midnight S3, then `yarn compile && yarn sync:zk`.
