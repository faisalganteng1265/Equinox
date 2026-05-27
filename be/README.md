# Equinox Backend

Backend ini adalah orchestration layer untuk `Equinox` di `Mantle Sepolia`.

## Scope

- read state dari `Vault`, `Agent Registry`, `Strategy Registry`, `Exchange`, dan adapter mock
- expose REST API yang siap dipakai frontend
- sign write actions untuk agent/operator dengan `viem`
- optional demo mint untuk top up mock asset di testnet

## Setup

1. Copy env:

```bash
cp .env.example .env
```

2. Isi semua address hasil deploy `EquinoxCore` dan `OPERATOR_PRIVATE_KEY`.

3. Install dependencies dari root repo:

```bash
pnpm install
```

4. Jalankan backend:

```bash
pnpm --filter @equinox/be dev
```

## API

Read endpoints:

- `GET /health`
- `GET /api/contracts`
- `GET /api/vault`
- `GET /api/portfolio`
- `GET /api/market`
- `GET /api/agents/:agentId?limit=10`

Write endpoints:

- `POST /api/rebalance/preview`
- `POST /api/rebalance/execute`
- `POST /api/rebalance/reject`
- `POST /api/market/snapshots`
- `POST /api/market/prices`
- `POST /api/demo/mint`

Jika `WRITE_API_KEY` diisi, semua write endpoint wajib mengirim header:

```text
x-api-key: <WRITE_API_KEY>
```

## Expected FE Split

- FE user wallet:
  - approve token
  - deposit
  - withdraw
- BE operator wallet:
  - update market snapshot
  - update market price
  - preview rebalance
  - execute rebalance
  - record rejected decision
