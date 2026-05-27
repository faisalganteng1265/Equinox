# SC Task Breakdown

## Goal

Membuat `sc/` menjadi smart contract layer Equinox yang:

- aman untuk demo dan testnet
- mudah diaudit
- siap menerima adapter nyata
- bertumbuh menuju mainnet readiness

---

## Current State

### Sudah ada

- core vault
- agent registry
- mock asset layer
- mock exchange
- mock adapters
- risk guardrails
- preview/reject/execute rebalance
- deploy script
- tests yang lumayan kuat untuk MVP

### Belum lengkap

- fuzz/invariant depth yang lebih tinggi
- gas report discipline
- frontend-facing read helper yang lebih kaya
- real adapter path
- audit prep package

---

## P0: Harden the Current Mock-Based Core

## Task 1: Expand Test Coverage

### Work

- tambah fuzz tests untuk:
  - allocation sum mismatch
  - duplicate targets
  - unsupported asset
  - unsupported adapter
  - withdrawal edge cases
- tambah invariant-style tests untuk:
  - no asset loss inside mock ecosystem
  - target weights reset/store consistency
  - blocked actions do not move funds

### Files likely involved

- `sc/test/`

### Done when

- failure path penting tidak hanya dites dengan fixed example

---

## Task 2: Gas Reporting

### Work

- aktifkan gas snapshots/report
- ukur:
  - deposit
  - withdraw
  - preview rebalance
  - execute rebalance
  - record rejected decision

### Done when

- ada baseline biaya fungsi utama

---

## Task 3: Frontend Read Helpers

### Why

Jika FE butuh terlalu banyak transform off-chain, bisa bantu dengan helper view.

### Work

- evaluasi kebutuhan helper view seperti:
  - allocation summary
  - active strategy summary
  - latest adapter snapshot rollup

### Done when

- FE/BE tidak perlu multicall berlebihan untuk kebutuhan sederhana

---

## Task 4: Deployment and Config Hygiene

### Work

- version output deploy
- simpan address artifacts yang mudah dipakai FE/BE
- pastikan deploy validation pasca-deploy

### Done when

- deploy repeatable dan address handoff rapi

---

## P1: Contract Architecture for Real Integrations

## Task 5: Adapter Interface Review

### Work

- audit `IStrategyAdapter` dari perspektif adapter nyata
- pastikan interface cukup untuk:
  - Aave-like adapter
  - CeFi accounting adapter
  - reporting hooks

### Done when

- interface tidak perlu dibongkar total saat real integration mulai

---

## Task 6: Risk Model Deepening

### Work

- tambahkan profile-based adapter constraints bila perlu
- tambahkan per-venue or per-asset policy flags
- evaluasi circuit breaker rules

### Done when

- vault guardrails siap untuk venue nyata yang lebih kompleks

---

## Task 7: Audit Prep

### Work

- rapikan NatSpec jika masih ada gap
- buat contract assumptions doc
- buat threat model notes
- buat privileged role matrix

### Done when

- repo SC siap di-review lebih formal

---

## P2: Mainnet and Institutional Path

## Task 8: Real Strategy Adapters

### Work

- buat adapter produksi untuk protocol yang benar-benar tersedia
- tambahkan fork tests
- tambahkan behavior tests untuk protocol state edge cases

### Done when

- setidaknya satu adapter nyata terbukti jalan di test/fork

---

## Task 9: Emergency and Admin Controls

### Work

- evaluasi pause granularity
- evaluasi emergency withdrawal patterns
- evaluasi role separation untuk production

### Done when

- ada control surface yang cukup untuk mainnet incidents

---

## Task 10: External Audit Remediation Loop

### Work

- jalankan audit
- perbaiki temuan
- tambah regression test untuk setiap temuan

### Done when

- semua temuan kritis/high ditutup dengan bukti test

---

## Dependencies

- `BE` akan memberi tahu kebutuhan helper view dan semantics execution
- `AI` akan mempengaruhi metadata/reasoning semantics, bukan custody semantics inti
- protocol availability nyata menentukan bentuk adapter produksi

---

## Definition of Done for SC

SC dianggap `done` untuk fase berikutnya jika:

- test depth kuat
- gas baseline tersedia
- role and risk assumptions terdokumentasi
- adapter interface siap untuk venue nyata
- deployment discipline rapi
