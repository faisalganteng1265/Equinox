# BE Task Breakdown

## Goal

Membuat `be/` menjadi orchestration backend Equinox yang:

- stabil untuk demo
- punya contract interface yang rapi
- siap menerima AI engine
- bisa tumbuh menjadi automation layer nyata

---

## Current State

### Sudah ada

- read API untuk contracts, vault, portfolio, market, agent
- write API untuk preview / execute / reject / snapshot / price / demo mint
- operator signer via `viem`
- live integration dengan Mantle Sepolia

### Belum lengkap

- database
- scheduler
- automation loop
- structured logging matang
- test suite formal
- retry policy matang
- observability
- auth beyond `WRITE_API_KEY`

---

## P0: Backend Hardening for Current Demo

## Task 1: Environment Validation Hardening

### Work

- validasi semua env wajib saat boot
- fail fast jika address atau private key invalid
- tampilkan boot summary yang aman

### Files likely involved

- `be/src/config/env.ts`
- `be/src/index.ts`

### Done when

- backend tidak bisa start dalam state setengah valid

---

## Task 2: Consistent Error Contract

### Work

- audit semua endpoint error shape
- standarkan:
  - `error`
  - `details`
  - `statusCode`
  - optional machine-readable reason

### Files likely involved

- `be/src/lib/app-error.ts`
- `be/src/index.ts`
- `be/src/services/equinox.ts`

### Done when

- FE bisa mengandalkan satu bentuk error response

---

## Task 3: Logging and Request Correlation

### Work

- tambahkan request ID
- log endpoint, status, elapsed time
- log tx hash untuk write actions
- log preview result for execute/reject

### Done when

- setiap action penting bisa ditelusuri dari request ke tx

---

## Task 4: RPC Reliability Basics

### Work

- tambah retry minimal untuk read path penting
- tambah timeout yang eksplisit
- tambah fallback handling kalau RPC lambat

### Done when

- backend tidak mudah gagal hanya karena hiccup kecil dari public RPC

---

## Task 5: Backend Test Skeleton

### Work

- pilih test framework
- buat smoke tests untuk:
  - `/health`
  - `/api/contracts`
  - `/api/portfolio`
  - `/api/agents/:id`
  - `/api/rebalance/preview`

### Done when

- ada minimal regression protection untuk endpoint inti

---

## P1: Automation Foundation

## Task 6: Add Persistence Layer

### Why

Tanpa DB, backend tidak bisa menjadi orchestration engine sungguhan.

### Work

- pilih database
- simpan:
  - market snapshots history
  - rebalance jobs
  - execution attempts
  - operator actions
  - reasoning payload references

### Suggested new folder shape

- `be/src/db/`
- `be/src/repositories/`
- `be/src/models/`

### Done when

- backend punya state historis di luar chain

---

## Task 7: Scheduler / Job Runner

### Work

- buat scheduler loop
- definisikan jobs:
  - fetch market data
  - compute targets
  - preview rebalance
  - execute rebalance
  - record rejected decision

### Suggested new folder shape

- `be/src/jobs/`
- `be/src/workers/`

### Done when

- backend bisa bekerja tanpa trigger manual dari FE

---

## Task 8: Internal Domain Modules

### Work

- pisahkan domain service:
  - `portfolio-service`
  - `market-service`
  - `rebalance-service`
  - `agent-service`
  - `operator-service`

### Done when

- logic tidak terlalu terpusat di satu service file

---

## Task 9: AI Engine Integration Contract

### Work

- definisikan request/response untuk AI service
- tentukan format:
  - market input
  - risk profile input
  - proposed targets
  - reasoning payload
  - confidence score

### Done when

- `BE` bisa memanggil `AI` nanti tanpa refactor arsitektur besar

---

## P2: Production and Institutional Path

## Task 10: Real Integration Adapters

### Work

- buat connector layer untuk:
  - Bybit API
  - market data providers
  - real protocol metadata

### Done when

- backend tidak lagi hanya berbicara ke mock state

---

## Task 11: Auth and Access Maturity

### Work

- upgrade dari `WRITE_API_KEY`
- role-based internal auth
- dual approval path untuk action sensitif

### Done when

- backend write surface tidak bergantung pada shared static key saja

---

## Task 12: Observability and Ops

### Work

- metrics
- health dashboards
- alerting
- dead-letter and failure visibility

### Done when

- operator tahu kapan strategy loop gagal dan kenapa

---

## Dependencies

- `AI` dibutuhkan untuk automation yang benar-benar cerdas
- `SC` harus stabil untuk write semantics
- `FE` akan bergantung pada response shape yang stabil

---

## Definition of Done for BE

BE dianggap `done` untuk fase berikutnya jika:

- response contract stabil
- write actions aman dan traceable
- ada persistence
- ada scheduler
- ada integration contract ke AI
- ada basic automated tests
