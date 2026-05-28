# BE Task Breakdown

## Goal

Membuat `be/` menjadi orchestration backend Equinox yang:

- stabil untuk demo
- punya contract interface yang rapi
- memegang strategy logic utama
- memakai `OpenRouter` hanya untuk reasoning
- bisa tumbuh menjadi automation layer nyata

---

## Current State

### Sudah ada

- read API dan write API inti sudah hidup
- env validation fail-fast
- error contract konsisten dengan `reason`
- structured logging dan request correlation
- timeout dan retry dasar untuk RPC reads
- smoke test backend dengan `vitest`
- contract address dan signer operator live di Mantle Sepolia
- **`reasoning.ts`** — OpenRouter integration dengan fallback deterministik
- **`strategy.ts`** — kalkulasi target weights dari risk profile (Conservative/Balanced/Aggressive)
- **`orchestrator.ts`** — autonomous loop: iterate semua vault → refresh market data → compute strategy → reasoning → preview → execute/reject
- **`market-sim.ts`** — real market data: USDY dari US Treasury, mETH dari DeFiLlama, fBTC dari Bybit, MI4 dari Mantle DeFi pools
- per-user vault iteration via `VaultFactory.allVaults()`
- reasoning text dikirim ke on-chain via `detailsURI`

### Yang masih tertinggal

- belum ada persistence layer (tidak kritis untuk hackathon — on-chain sudah persistent)
- logic masih cukup terpusat di `equinox.ts` (domain split nice-to-have)
- belum ada auth maturity di luar `WRITE_API_KEY`
- belum ada observability ops-grade

---

## P1: Automation Foundation

## Task 1: Add Persistence Layer

**Status: ⏭️ SKIP untuk hackathon**

On-chain decision log via ERC-8004 sudah berfungsi sebagai audit trail permanen. DB off-chain relevan untuk Phase 2 saat reasoning text perlu diquery by hash dan analytics historis dibutuhkan.

---

## Task 2: Split Domain Modules

**Status: ⏳ nice-to-have**

`equinox.ts` masih besar tapi tidak blocking untuk demo. Split ke `portfolio-service`, `market-service`, `strategy-service` bisa dilakukan post-hackathon.

---

## Task 3: OpenRouter Reasoning Layer

**Status: ✅ DONE**

### Apa yang sudah dibangun

- `services/reasoning.ts`:
  - call OpenRouter API dengan vault state + market APY + proposed targets + risk profile
  - model: `openai/gpt-4o-mini` (configurable via `OPENROUTER_MODEL`)
  - fallback deterministik jika API key tidak ada atau request gagal
  - timeout 8 detik per request
- Env vars: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`

---

## Task 4: Scheduler and Job Runner

**Status: ✅ DONE**

### Apa yang sudah dibangun

- `services/orchestrator.ts`:
  - `startOrchestrator()` dipanggil dari `index.ts` saat `ORCHESTRATOR_ENABLED=true`
  - tiap cycle: `refreshMarketData()` → iterate vaults → per vault: portfolio read → strategy compute → drift check → reasoning → preview → execute/reject
  - env vars: `ORCHESTRATOR_ENABLED`, `ORCHESTRATOR_INTERVAL_MS`, `DRIFT_THRESHOLD_BPS`
  - vault kosong (0 value) di-skip
  - semua error per vault di-catch dan di-log tanpa menghentikan loop

---

## Task 5: Per-User Vault Context

**Status: ✅ DONE**

### Apa yang sudah dibangun

- Orchestrator memanggil `VaultFactory.allVaults()` untuk mendapat semua vault aktif
- Fallback ke `VAULT_ADDRESS` jika `VAULT_FACTORY_ADDRESS` tidak dikonfigurasi
- Setiap vault diproses secara independent dengan vault address sebagai context

---

## Task 5b: Real Market Data (bonus, tidak ada di P1 original)

**Status: ✅ DONE**

### Apa yang sudah dibangun

- `services/market-sim.ts`:
  - **USDY**: APY dari US Treasury Fiscal Data API (`api.fiscaldata.treasury.gov`) — T-Bill rate, no auth
  - **mETH**: APY dari DeFiLlama yields — pool mETH Mantle atau fallback ETH staking (Lido/Rocket Pool)
  - **fBTC**: APY dari Bybit public API — BTC Flexible Savings rate
  - **MI4**: median APY top Mantle pools by TVL dari DeFiLlama
  - Harga aset diupdate via sine-wave simulation (±5% dari base price)
  - Graceful fallback per sumber: jika satu API gagal, adapter itu pakai sine-wave
  - Risk scores di-cap ≤ 39 agar semua profil (termasuk Conservative ≤ 40) tetap bisa rebalance

---

## P2: Production and Institutional Path

## Task 6: Real Integration Adapters

**Status: ⏳ Phase 2**

- Bybit API connector nyata untuk CeFi execution
- Real protocol adapters (Aave, CIAN)

---

## Task 7: Auth and Access Maturity

**Status: ⏳ Phase 3**

---

## Task 8: Observability and Ops

**Status: ⏳ Phase 3**

---

## Definition of Done for BE (Hackathon Scope)

- ✅ persistence: on-chain via ERC-8004
- ✅ reasoning provider layer: OpenRouter + fallback
- ✅ scheduler/job runner: autonomous orchestrator loop
- ✅ per-vault processing: VaultFactory.allVaults()
- ✅ real market data: Treasury + DeFiLlama + Bybit
- ✅ strategy logic: deterministic, terkontrol di BE
- ✅ reasoning text: dikirim ke FE via on-chain detailsURI
