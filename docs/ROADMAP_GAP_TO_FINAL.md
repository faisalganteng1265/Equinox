# Equinox Roadmap: Gap to Final

## Purpose

Dokumen ini memetakan perjalanan `Equinox` dari kondisi repo saat ini menuju:

1. `Hackathon-complete product demo`
2. `Pilot-ready product`
3. `Mainnet-ready platform`
4. `Institutional-grade product`

Dokumen ini sengaja dibuat jujur terhadap fakta lapangan. Ia membedakan dengan tegas:

- apa yang sudah benar-benar ada
- apa yang masih mock atau simulasi
- apa yang belum ada sama sekali
- apa yang wajib dibangun di luar coding biasa agar pantas disebut `institutional-grade`

---

## 1. Current State

## 1.1 What is already working

### Smart Contracts

- `Mantle Sepolia` deployment sudah berhasil.
- Core contracts sudah ada:
  - `MantleVaultOrchestrator`
  - `MantleAgentRegistry8004`
  - `StrategyRegistry`
  - `MockAssetExchange`
  - `MockAssetToken`
  - mock strategy adapters
- Risk guardrails on-chain sudah nyata:
  - risk profile limits
  - preview rebalance
  - blocked decision logging
  - execute rebalance
- Fund movement nyata di dalam ekosistem mock:
  - deposit
  - withdraw
  - swap antar mock asset
  - deploy dana ke adapter mock
- Agent logging on-chain sudah nyata via registry.

### Backend

- Backend Express sudah bisa:
  - read state live dari contract
  - expose portfolio/agent/market/contracts API
  - sign operator actions
  - preview / execute / reject rebalance
  - update market snapshots
  - update market prices
  - optional demo mint

### Frontend

- FE Next.js sudah tersambung ke backend dan smart contracts.
- Wallet connect sudah memakai `RainbowKit`.
- FE user flow sudah ada:
  - connect wallet
  - deposit
  - withdraw
  - read portfolio live
  - preview / execute / reject via backend
- `@mantleio/sdk` sudah dipakai untuk estimasi gas Mantle L2.

### Dev Workflow

- Monorepo `pnpm` untuk `fe` dan `be` sudah rapi.
- `sc` tetap terpisah dengan Foundry.
- Build dan lint utama untuk `fe` dan `be` sudah lolos.

---

## 1.2 What is still mock or simulated

- Semua asset utama masih `mock ERC20`:
  - `USDY`
  - `mETH`
  - `fBTC`
  - `MI4`
- Semua venue adapter masih `mock`:
  - idle
  - DeFi lending
  - CeFi earn
- Yield snapshots masih `operator-fed`, belum autonomous.
- Capital topology CeFi pivot masih simulasi UX, belum eksekusi venue nyata.
- Agent logic masih backend-triggered/manual, belum AI engine otonom.

---

## 1.3 What does not exist yet

- Python `AI / quant engine`
- Bybit API connector nyata
- Aave / CIAN / real protocol adapters
- scheduler / automation loop untuk strategy execution
- data ingestion pipeline mainnet/API yang berjalan otomatis
- persistent analytics store
- audit trail and observability stack
- formal backend test suite
- FE E2E test suite
- production deployment architecture
- legal/compliance/custody framework

---

## 2. Core Gap Summary

Kalau dibandingkan dengan product design awal, gap utama Equinox saat ini adalah:

1. `AI engine gap`
   Saat ini belum ada optimizer Python, risk matrix engine, atau reasoning generator sungguhan.

2. `Cross-world execution gap`
   Visi DeFi <-> Bybit CeFi bridge belum terwujud. Yang ada masih mock adapter dan simulated route.

3. `Automation gap`
   Sistem belum autonomous. Keputusan belum dihasilkan dan dijalankan oleh worker/engine terjadwal.

4. `Production gap`
   Sistem belum punya hardening, observability, deployment architecture, key management, testing depth, atau incident controls.

5. `Institutional gap`
   Belum ada compliance, policy controls, access model, custody model, audit posture, dan operational governance yang dibutuhkan untuk menyandang label institutional-grade.

---

## 3. Maturity Ladder

## 3.1 Stage A: Hackathon-Ready Integrated Demo

### Definition

Produk sudah bisa didemokan end-to-end di `Mantle Sepolia` dengan:

- smart contracts live
- frontend live
- backend live
- wallet flow jalan
- rebalance demo jalan
- risk guardrail demo jalan

### Status

`Sudah tercapai sebagian besar.`

### Remaining work to fully close Stage A

- polish UX FE untuk testing dan demo
- faucet / top-up flow yang rapi
- full manual testing script
- bug bash integrasi FE-BE-SC
- final demo script untuk presentasi

---

## 3.2 Stage B: Pilot-Ready Product

### Definition

Produk sudah bisa dijalankan sebagai pilot terbatas untuk user awal dengan:

- automation dasar
- data ingestion real
- monitoring minimum
- admin controls yang aman
- decision logs yang dapat diaudit

### Key change from Stage A

Sistem tidak lagi bergantung pada trigger manual untuk terus hidup.

---

## 3.3 Stage C: Mainnet-Ready Platform

### Definition

Produk sudah siap untuk memegang value riil di mainnet dengan:

- real strategy adapters
- security audit
- treasury and risk controls
- key management yang benar
- rollback/emergency procedures

### Key change from Stage B

Sistem berpindah dari simulated venues ke real on-chain / off-chain execution path.

---

## 3.4 Stage D: Institutional-Grade Product

### Definition

Produk sudah memenuhi ekspektasi minimum untuk disebut institutional-grade:

- security posture matang
- governance dan controls matang
- observability matang
- legal/compliance framing jelas
- reliable execution and reporting
- vendor and integration due diligence
- custody and operational risk model jelas

### Important note

`Institutional-grade` bukan sekadar “fitur lebih banyak”. Ini adalah kombinasi:

- software maturity
- security maturity
- operating model maturity
- legal/compliance maturity

---

## 4. Roadmap Phases

## Phase 0: Close the Hackathon Demo

### Goal

Menjadikan apa yang sudah dibangun benar-benar stabil, teruji manual, dan siap didemokan tanpa improvisasi berbahaya.

### Workstreams

#### Product / Demo

- tetapkan 3-4 skenario demo final:
  - user deposits mock asset
  - backend previews and executes rebalance
  - blocked rebalance recorded on-chain
  - CeFi pivot simulation shown in UX
- tulis demo script yang preskriptif

#### Frontend

- rapikan copy, explorer links, tx states, loading and error states
- tambahkan demo faucet/top-up flow
- rapikan owner-wallet vs operator-wallet messaging
- pastikan mobile and desktop sanity checks

#### Backend

- validasi semua env
- tambah request logging yang lebih rapi
- tambah timeout/retry minimum untuk RPC
- pastikan `WRITE_API_KEY` flow benar

#### Smart Contracts

- tambah fuzz tests untuk preview and execute paths
- tambah gas report
- tambah read helpers jika FE masih butuh transform besar

#### QA

- lakukan full manual test matrix:
  - connect wallet
  - wrong network
  - wrong wallet
  - deposit
  - withdraw
  - preview valid
  - preview invalid
  - execute
  - reject
  - adapter snapshot update
  - price update

### Exit Criteria

- semua flow utama lulus manual test checklist
- demo script bisa diulang dari awal tanpa patch kode
- tidak ada blocker kritis di FE-BE-SC integration

---

## Phase 1: Build the Automation Core

### Goal

Mengubah Equinox dari “backend action panel” menjadi sistem yang benar-benar punya engine operasional.

### Workstreams

#### AI / Quant

- buat service `python` atau service terpisah untuk:
  - yield curve evaluation
  - risk scoring
  - portfolio target generation
  - reasoning generation
- definisikan input/output contract yang jelas antara AI engine dan backend

#### Backend Automation

- buat scheduler / worker loop
- implement periodic jobs:
  - fetch market data
  - compute target portfolio
  - preview rebalance
  - execute or reject
  - log result

#### Data Ingestion

- tentukan source data nyata:
  - mainnet protocol/APY
  - price sources
  - volatility signals
  - optional CeFi rate feed
- normalisasi data ke internal schema

#### Persistence

- tambahkan database untuk:
  - market snapshots history
  - rebalance jobs
  - execution attempts
  - error log
  - generated reasoning text

### Exit Criteria

- sistem bisa menghasilkan keputusan terjadwal tanpa klik manual
- setiap keputusan punya data source, output target, preview result, dan audit log
- backend tidak lagi sekadar API server, tetapi orchestration engine aktif

---

## Phase 2: Real Data, Simulated Execution

### Goal

Memenuhi pendekatan yang sudah disepakati:

- `real data`
- `simulated execution`
- `real guardrails`
- `real logging`

### Workstreams

#### Market Intelligence

- gunakan data mainnet/API nyata untuk:
  - APY
  - liquidity score
  - risk score
  - price
- update snapshot adapter secara otomatis

#### Explainability

- reasoning generator harus konsisten dengan data real
- simpan reasoning payload lengkap off-chain
- hash reasoning tetap dicatat on-chain

#### Frontend

- tampilkan freshness and provenance:
  - source timestamp
  - source label
  - risk score
  - liquidity score
  - blocked reason

### Exit Criteria

- demo tidak lagi hanya “fake numbers”
- keputusan agent benar-benar berasal dari data real
- FE dapat menunjukkan alasan agent yang bisa diaudit

---

## Phase 3: Real CeFi and Protocol Integration

### Goal

Mengganti mock execution path dengan integration path nyata.

### Workstreams

#### Bybit Integration

- implement secure Bybit connector
- baca earn rates
- buat internal action model untuk CeFi route decisions
- tentukan custody flow dan operational approval model

#### Real Protocol Adapters

- buat `IStrategyAdapter` production implementations untuk:
  - Aave
  - protocol lain yang benar-benar tersedia di target network
- tambahkan fork tests and integration tests

#### Execution Safety

- tambahkan pre-flight validation lebih ketat
- tambah per-adapter limits
- tambah circuit breaker dan pause paths

### Important dependency

Tahap ini bergantung pada:

- protocol availability nyata
- integration testing yang cukup
- security review sebelum mainnet value

### Exit Criteria

- minimal satu adapter on-chain nyata berjalan di fork dan test environment
- minimal satu CeFi connector nyata berjalan di staging
- execution path tidak lagi 100% mock

---

## Phase 4: Mainnet Readiness

### Goal

Membuat Equinox aman untuk memegang nilai riil dalam skala terbatas.

### Workstreams

#### Smart Contract Security

- audit internal penuh
- audit eksternal independen
- threat model
- invariants and fuzz coverage lebih dalam

#### Key Management

- pindah dari raw private key ke signer strategy yang aman
- pertimbangkan:
  - HSM / KMS
  - multisig
  - role separation

#### Backend Reliability

- retry and backoff
- job idempotency
- dead-letter handling
- state reconciliation

#### Monitoring

- metrics
- alerting
- tx failure dashboard
- RPC health monitoring

#### Release Engineering

- staging / production environments
- deployment pipelines
- versioned config
- rollback procedures

### Exit Criteria

- semua critical controls untuk mainnet small-scale launch tersedia
- hasil audit ditindaklanjuti
- testnet/fork/staging behavior konsisten

---

## Phase 5: Institutional-Grade Controls

### Goal

Mengubah sistem dari `good Web3 product` menjadi `institutional-grade operating platform`.

### Workstreams

#### Governance and Access

- RBAC matang di seluruh backend and ops tooling
- dual approval untuk operation sensitif
- maker-checker flow untuk perubahan parameter penting
- admin activity audit trail

#### Compliance and Legal

- definisikan product perimeter:
  - software only
  - managed strategy
  - advisory signal
  - custody or non-custody
- legal review untuk:
  - jurisdiction
  - RWA exposure claims
  - CeFi integration obligations
  - user disclosures

#### Operational Risk

- incident response runbooks
- disaster recovery plan
- vendor risk register
- dependency risk review

#### Reporting

- institutional reporting layer:
  - exposure reports
  - performance attribution
  - drawdown reports
  - decision audit exports

#### Security Operations

- secrets rotation
- access reviews
- anomaly detection
- environment hardening

### Exit Criteria

- ada documented control framework
- ada repeatable ops process
- ada legal/compliance stance yang tertulis
- ada reporting and auditability yang pantas untuk stakeholder institusional

---

## 5. Workstream Backlog by Priority

## P0: Must Have Next

- end-to-end manual testing
- FE UX cleanup for demo
- faucet / demo mint UX
- backend scheduler design
- data ingestion design
- AI engine interface contract

## P1: High Value

- persistent database
- automated snapshot updates
- reasoning generation engine
- more complete backend logging and monitoring
- SC fuzz + invariant testing

## P2: Mainnet Path

- protocol adapters nyata
- Bybit connector nyata
- fork integration suite
- audit preparation

## P3: Institutional Path

- compliance workstream
- reporting workstream
- governance controls
- KMS/HSM/multisig operational model

---

## 6. Critical Path

Kalau tujuan utamanya adalah bergerak secepat mungkin dari kondisi sekarang ke produk yang benar-benar naik kelas, urutan kritisnya adalah:

1. `Stabilize demo`
2. `Automate decision loop`
3. `Use real market data`
4. `Persist and observe everything`
5. `Integrate real venues`
6. `Audit and harden`
7. `Add governance/compliance/reporting`

Yang tidak boleh dibalik:

- jangan kejar mainnet sebelum automation and observability cukup
- jangan klaim institutional-grade sebelum audit + ops + compliance framework ada
- jangan kejar real CeFi bridge sebelum custody and operational risk model jelas

---

## 7. Risks

## Product Risks

- terlalu banyak scope hackathon yang terbawa ke roadmap panjang
- visual demo bagus tetapi engine decision belum matang

## Technical Risks

- RPC/public infra tidak stabil
- mainnet protocol assumptions berubah
- adapter complexity underestimated
- AI reasoning tidak konsisten dengan execution path

## Security Risks

- operator key exposure
- unsafe backend write endpoints
- insufficient invariant coverage
- missing incident response

## Business / Legal Risks

- penggunaan istilah `institutional-grade` terlalu dini
- CeFi integration membawa custody and compliance burden
- RWA claims membutuhkan framing legal yang hati-hati

---

## 8. Recommended Team Sequencing

Jika dikerjakan oleh tim kecil, urutan fokus yang paling rasional:

### Track 1: Product and Demo Stability

- FE polish
- manual test checklist
- scripted demo flow

### Track 2: Automation Engine

- scheduler
- data ingestion
- strategy generation
- reasoning generation

### Track 3: Security and Reliability

- test coverage
- secrets hygiene
- monitoring
- audit prep

### Track 4: Real Integrations

- Bybit
- real protocol adapters
- staging and fork validation

### Track 5: Institutional Layer

- governance
- reporting
- compliance
- operational controls

---

## 9. Immediate 2-4 Week Plan

Kalau target berikutnya adalah membuat Equinox terlihat jauh lebih matang tanpa lompat terlalu jauh, saya sarankan 2-4 minggu berikut dipakai untuk ini:

### Week 1

- full manual integration test
- bug fixing FE-BE-SC
- faucet / mint UX
- final demo script

### Week 2

- backend scheduler skeleton
- data model for market snapshots and rebalance jobs
- Python engine interface contract

### Week 3

- first real data ingestion
- automatic snapshot updater
- reasoning generator MVP

### Week 4

- autonomous preview loop
- autonomous execute/reject loop
- dashboard refresh with data provenance and job status

### Success definition for the next 4 weeks

Equinox should evolve from:

- `manual integrated demo`

into:

- `autonomous simulated portfolio engine with real market data`

That is the most valuable next maturity jump.

---

## 10. Final Honest Assessment

Saat dokumen ini dibuat, Equinox adalah:

- `strong hackathon foundation`
- `working integrated testnet product`
- `credible architecture demo`

Tetapi belum:

- autonomous AI portfolio engine
- real DeFi/CeFi bridge
- mainnet-ready system
- institutional-grade product

Roadmap ini dibuat untuk menutup gap tersebut secara bertahap, tanpa berpura-pura bahwa semua itu sudah dekat atau sudah otomatis tercapai.
