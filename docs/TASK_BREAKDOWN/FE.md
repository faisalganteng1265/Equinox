# FE Task Breakdown

## Goal

Membuat `fe/` menjadi frontend Equinox yang:

- stabil untuk demo hackathon
- jelas untuk user wallet flow
- siap untuk manual testing penuh
- mudah dihubungkan ke automation backend nanti

---

## Current State

### Sudah ada

- Next.js app hidup
- wallet connect via `RainbowKit`
- read portfolio live via backend proxy
- deposit and withdraw via wallet
- preview / execute / reject via backend
- Mantle gas estimate via `@mantleio/sdk`
- demo faucet flow via backend `/api/demo/mint`
- tx explorer link untuk write flow
- agent registry, decision feed, dan topology sudah live
- responsive pass dasar dan micro-polish P0 sudah beres
- checklist manual ada di [FE_MANUAL_TEST_CHECKLIST.md](C:/Users/bagas/Downloads/Dapp%20Project/Equinox/docs/FE_MANUAL_TEST_CHECKLIST.md)

### Yang masih tertinggal

- `page.tsx` masih cukup besar
- belum ada automated FE test harness
- belum ada reasoning UI yang kaya untuk AI output berikutnya

---

## P1: Maintainability and Testability

## Task 1: Refactor Data Mapping Layer

### Work

- pindahkan transform tambahan dari `page.tsx` ke helper atau hooks
- kecilkan tanggung jawab `page.tsx`
- kelompokkan selector UI per domain section

### Done when

- `page.tsx` lebih fokus ke composition

---

## Task 2: Split Action Components

### Work

- pisahkan action panel dari page utama
- pisahkan tx state panel
- pisahkan faucet surface dari container utama

### Done when

- komponen action bisa dirawat tanpa membongkar seluruh halaman

---

## Task 3: Automated Frontend Tests

### Work

- tambah unit test minimal untuk helper mapping
- tambah integration test untuk action state
- tambah E2E smoke plan untuk:
  - app load
  - backend reachable
  - key controls visible

### Done when

- ada regression harness dasar untuk FE

---

## P2: Product Maturity

## Task 4: Richer Portfolio and Reasoning UI

### Work

- tampilkan reasoning payload AI yang terstruktur
- tampilkan confidence score
- tampilkan snapshot freshness
- tampilkan blocked decision analytics

### Done when

- FE menampilkan konteks keputusan, bukan hanya state saat ini

---

## Task 5: Institutional Reporting Surface

### Work

- exportable reports
- exposure summary
- performance attribution
- compliance summary per risk profile

### Done when

- FE bisa dipakai sebagai operator console dan reporting surface

---

## Definition of Done for FE

FE dianggap siap untuk fase berikutnya jika:

- automated tests dasar sudah ada
- komposisi komponen utama lebih rapi
- reasoning output AI bisa ditampilkan jelas
- manual testing checklist tetap relevan dan mudah dijalankan
