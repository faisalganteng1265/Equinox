# Equinox Task Breakdown

Dokumen ini memecah roadmap Equinox menjadi task breakdown per area utama:

- [FE.md](FE.md)
- [BE.md](BE.md)
- [SC.md](SC.md)
- [AI.md](AI.md)

Ini adalah breakdown operasional dari [ROADMAP_GAP_TO_FINAL.md](../ROADMAP_GAP_TO_FINAL.md).

---

## Repo Status Sekarang

### FE

- wallet flow, faucet, deposit, withdraw, preview, execute, dan reject sudah hidup
- auto vault creation: wallet connect tanpa vault langsung trigger create, tidak perlu tombol manual
- multi-wallet support: switch wallet ke akun baru tidak lagi error boot screen
- reasoning text dari OpenRouter ditampilkan langsung di agent feed
- explorer deep link sudah menyentuh tx, registry, asset, dan adapter surfaces
- responsive pass dasar sudah beres

### BE

- env validation sudah fail-fast
- error contract sudah stabil dengan `reason` machine-readable
- request correlation dan structured logging sudah ada
- retry/timeout RPC dasar sudah ada
- **OpenRouter reasoning layer sudah ada** (`reasoning.ts`)
- **Strategy computation layer sudah ada** (`strategy.ts`)
- **Autonomous orchestrator loop sudah ada** (`orchestrator.ts`)
- **Real market data fetching sudah ada** (`market-sim.ts`) — US Treasury, DeFiLlama, Bybit API
- **Per-user vault iteration sudah ada** — orchestrator looping semua vault dari VaultFactory

### SC

- fuzz test dan invariant suite sudah hidup
- gas report baseline sudah ada
- deployment export artifact sudah ada
- VaultFactory sudah live — 1 user = 1 vault = 1 agent identity

### AI / Reasoning

- OpenRouter integration sudah live di backend
- Strategy calculation tetap deterministic di backend
- Reasoning text digenerate dari LLM (gpt-4o-mini) atau fallback deterministik
- Reasoning text disimpan on-chain via `detailsURI` dan ditampilkan di FE agent feed
- Real data: USDY dari US Treasury, fBTC dari Bybit, mETH dari DeFiLlama

---

## P0 Status

- `FE P0`: ✅ selesai
- `BE P0`: ✅ selesai
- `SC P0`: ✅ selesai
- `AI architecture decision P0`: ✅ selesai

---

## P1 Status

- `BE reasoning layer`: ✅ selesai
- `BE scheduler/orchestrator`: ✅ selesai
- `BE per-user vault context`: ✅ selesai
- `BE real market data`: ✅ selesai
- `AI reasoning integration`: ✅ selesai
- `AI fallback safety`: ✅ selesai
- `FE reasoning display`: ✅ selesai
- `SC VaultFactory`: ✅ selesai
- `SC fuzz + invariant tests`: ✅ selesai
- `BE persistence layer`: ⏭️ skip untuk hackathon — on-chain = persistent
- `BE domain module split`: ⏳ nice-to-have, belum kritis

---

## Next Critical Sequence (Post-Hackathon)

1. `BE P2` — real Bybit connector, real protocol adapters
2. `SC P2` — audit prep, emergency controls, real adapter interfaces
3. `FE P2` — richer reasoning UI, performance attribution, institutional reporting
4. `BE + SC P3` — mainnet readiness, key management, monitoring

---

## Milestone Labels

- `M0-demo-stability` ✅
- `M1-p0-complete` ✅
- `M2-backend-foundation` ✅
- `M3-openrouter-reasoning` ✅
- `M4-automation-loop` ✅
- `M5-real-data-snapshots` ✅
- `M6-smart-contract-audit-prep` ⏳
- `M7-protocol-integration` ⏳
- `M8-mainnet-readiness` ⏳
- `M9-institutional-controls` ⏳
