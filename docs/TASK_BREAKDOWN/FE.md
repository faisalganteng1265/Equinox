# FE Task Breakdown

## Goal

Membuat `fe/` menjadi frontend Equinox yang:

- stabil untuk demo hackathon
- jelas untuk user wallet flow
- siap untuk manual testing penuh
- mudah dihubungkan ke automation backend

---

## Current State

### Sudah ada

- Next.js app hidup
- wallet connect via `RainbowKit`
- read portfolio live via backend proxy
- deposit dan withdraw via wallet
- preview / execute / reject via backend
- Mantle gas estimate via `@mantleio/sdk`
- demo faucet flow via backend `/api/demo/mint`
- tx explorer link untuk write flow
- agent registry, decision feed, dan topology sudah live
- responsive pass dasar dan micro-polish P0 sudah beres
- **auto vault creation**: wallet connect tanpa vault langsung trigger create otomatis
- **multi-wallet support**: switch wallet ke akun baru tidak lagi menampilkan boot error
- **reasoning text display**: agent feed menampilkan teks reasoning dari OpenRouter/fallback langsung

### Yang masih tertinggal

- `page.tsx` masih cukup besar (nice-to-have untuk di-split)
- belum ada automated FE test harness
- confidence score belum ditampilkan secara eksplisit di UI

---

## P1: Wallet and Vault UX

## Task 1: Auto Vault Creation

**Status: ✅ DONE**

### Apa yang sudah dibangun

- `useEffect` otomatis memanggil `createDemoPortfolio()` saat `isKnownMissingVault = true`
- Loading screen "Setting up your portfolio" selama proses
- Error screen dengan tombol retry jika creation gagal
- Tidak ada lagi tombol manual "Create demo portfolio"

---

## Task 2: Multi-Wallet Support

**Status: ✅ DONE**

### Bug yang diperbaiki

- `contractsQuery` sebelumnya tidak punya guard `enabled`, sehingga langsung call `/contracts?owner=addressB` saat wallet baru connect
- Backend melempar 404 "No Equinox vault exists for this owner" → boot error screen muncul
- Fix: `contractsQuery` sekarang di-enable hanya setelah `accountQuery` confirm vault exists

---

## Task 3: Reasoning Display di Agent Feed

**Status: ✅ DONE**

### Apa yang sudah dibangun

- `buildDecisionFeed` sekarang menampilkan `decision.detailsURI` langsung sebagai body
- Jika `detailsURI` ada → tampil teks reasoning dari OpenRouter/fallback
- Jika tidak ada → tampil pesan hash on-chain seperti sebelumnya
- Backward compatible dengan decisions lama yang tidak punya detailsURI

---

## P1: Maintainability (Nice-to-Have)

## Task 4: Refactor Data Mapping Layer

**Status: ⏳ post-hackathon**

---

## Task 5: Automated Frontend Tests

**Status: ⏳ post-hackathon**

---

## P2: Product Maturity

## Task 6: Richer Portfolio and Reasoning UI

**Status: ⏳ Phase 2**

- tampilkan confidence score dari reasoning
- tampilkan snapshot freshness dan source provenance (treasury.gov, bybit, defillama)
- tampilkan blocked decision analytics

---

## Task 7: Institutional Reporting Surface

**Status: ⏳ Phase 3**

---

## Definition of Done untuk FE (Hackathon Scope)

- ✅ wallet flow lengkap dari connect → auto create vault → dashboard
- ✅ multi-wallet switch tidak error
- ✅ deposit, withdraw, faucet berfungsi
- ✅ agent feed menampilkan reasoning text dari AI
- ✅ live APY dari real market data terlihat di topology
- ✅ decision history terupdate setelah orchestrator execute
