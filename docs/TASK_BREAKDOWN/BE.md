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

### Yang masih tertinggal

- belum ada persistence layer
- belum ada scheduler / worker loop
- logic masih cukup terpusat di service tunggal
- belum ada layer reasoning provider
- belum ada auth maturity di luar `WRITE_API_KEY`
- belum ada observability ops-grade

---

## P1: Automation Foundation

## Task 1: Add Persistence Layer

### Work

- pilih database
- simpan market snapshots history
- simpan execution attempts
- simpan rebalance jobs
- simpan reference ke payload reasoning

### Done when

- backend punya state historis di luar chain

---

## Task 2: Split Domain Modules

### Work

- pecah `services/equinox.ts` menjadi domain modules:
  - `portfolio-service`
  - `market-service`
  - `strategy-service`
  - `reasoning-service`
  - `agent-service`
  - `operator-service`

### Done when

- logic orchestration tidak menumpuk di satu file

---

## Task 3: OpenRouter Reasoning Layer

### Work

- buat client `OpenRouter` di backend
- desain prompt dan output schema untuk reasoning only
- strategy target tetap dihitung deterministic di backend
- reasoning provider hanya menerima context dan mengembalikan:
  - explanation
  - confidence
  - optional summary fields
- tambah fallback jika provider gagal

### Done when

- backend bisa menghasilkan reasoning kaya tanpa memindahkan strategy logic keluar dari `BE`

---

## Task 4: Scheduler and Job Runner

### Work

- buat loop job untuk:
  - fetch data
  - compute target portfolio
  - request reasoning
  - preview rebalance
  - execute atau reject
- tambah idempotency dan retry policy pada job layer

### Done when

- backend bisa berjalan tanpa trigger manual dari FE

---

## P2: Production and Institutional Path

## Task 5: Real Integration Adapters

### Work

- buat connector layer untuk:
  - Bybit API
  - market data providers
  - real protocol metadata

### Done when

- backend tidak lagi hanya berbicara ke mock state

---

## Task 6: Auth and Access Maturity

### Work

- upgrade dari `WRITE_API_KEY`
- role-based internal auth
- dual approval path untuk action sensitif

### Done when

- write surface tidak bergantung pada shared static key saja

---

## Task 7: Observability and Ops

### Work

- metrics
- dashboards
- alerts
- failure visibility

### Done when

- operator tahu kapan strategy loop gagal dan kenapa

---

## Definition of Done for BE

BE dianggap siap ke fase berikutnya jika:

- persistence ada
- reasoning provider layer ada
- scheduler/job runner ada
- domain modules tidak lagi menumpuk di satu service file
- strategy logic tetap deterministic dan terkontrol
- auth dan observability mulai naik kelas
