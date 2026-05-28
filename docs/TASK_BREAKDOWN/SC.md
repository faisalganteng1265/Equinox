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
- fuzz tests
- invariant suite
- gas report baseline
- deployment export artifact

### Yang masih tertinggal

- helper view yang lebih ramah FE/BE
- audit-prep documentation
- adapter interface review untuk venue nyata
- emergency/admin production controls

---

## P1: Contract Architecture and Audit Prep

## Task 1: Frontend-Facing Read Helpers

### Work

- evaluasi helper view:
  - allocation summary
  - active strategy summary
  - latest adapter snapshot rollup
- kurangi kebutuhan multicall FE/BE jika memang masuk akal

### Done when

- FE/BE tidak perlu transform terlalu berat untuk read path umum

---

## Task 2: Adapter Interface Review

### Work

- audit `IStrategyAdapter` untuk kebutuhan Aave-like dan CeFi accounting adapter
- cek reporting hooks dan emergency semantics yang belum ada

### Done when

- interface tidak perlu dibongkar besar saat real adapter dimulai

---

## Task 3: Audit Prep Package

### Work

- contract assumptions doc
- threat model notes
- privileged role matrix
- reference untuk gas baseline dan deployment artifact

### Done when

- repo `sc/` siap di-review lebih formal

---

## P2: Mainnet and Institutional Path

## Task 4: Real Strategy Adapters

### Work

- tambah adapter produksi untuk venue nyata yang memang tersedia
- tambah fork tests
- tambah edge-case tests per protocol

### Done when

- setidaknya satu adapter nyata terbukti jalan di test/fork

---

## Task 5: Emergency and Admin Controls

### Work

- evaluasi pause granularity
- evaluasi emergency withdrawal
- evaluasi role separation untuk production

### Done when

- ada control surface yang layak untuk incident handling

---

## Task 6: External Audit Remediation Loop

### Work

- jalankan audit
- tutup temuan
- tambah regression test per finding

### Done when

- semua temuan kritis/high ditutup dengan bukti test

---

## Definition of Done for SC

SC dianggap siap ke fase berikutnya jika:

- helper read path yang dibutuhkan FE/BE sudah jelas
- adapter interface siap untuk venue nyata
- audit-prep docs tersedia
- emergency/admin hardening punya desain yang jelas
