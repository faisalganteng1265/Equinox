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

### Belum lengkap

- faucet / top-up UX
- tx explorer UX
- loading and error polish
- state refresh polish after tx
- mobile polish
- E2E test suite
- explicit demo mode UX

---

## P0: Demo and Testing Stability

## Task 1: Demo Faucet Flow

### Why

Supaya user demo tidak perlu mint manual via backend tool atau curl.

### Work

- tambahkan tombol `Request Demo Assets`
- panggil endpoint backend demo mint jika diaktifkan
- tampilkan state:
  - idle
  - minting
  - success
  - failure
- batasi hanya untuk asset yang memang dipakai dalam demo

### Files likely involved

- `fe/src/app/page.tsx`
- `fe/src/components/modals.tsx`
- `fe/src/lib/equinox-api.ts`

### Done when

- user bisa top-up mock asset langsung dari FE
- error state jelas kalau backend mint dimatikan

---

## Task 2: Explorer Links and Tx Visibility

### Why

Saat ini user perlu visibility lebih jelas terhadap tx hasil deposit, withdraw, execute, dan reject.

### Work

- buat helper `explorerUrlForTx`
- tampilkan link ke Mantle explorer untuk:
  - deposit tx
  - withdraw tx
  - execute tx
  - reject tx
- tampilkan short tx hash yang konsisten di history and modal

### Files likely involved

- `fe/src/lib/equinox-ui.ts`
- `fe/src/components/modals.tsx`
- `fe/src/components/agents-page.tsx`
- `fe/src/components/v2-pieces.tsx`

### Done when

- semua tx penting bisa dibuka ke explorer dari FE

---

## Task 3: Loading and Error Polish

### Why

Supaya FE tidak terasa seperti prototype saat network lambat atau write action gagal.

### Work

- rapikan skeleton/loading states untuk:
  - portfolio
  - agents
  - strategy
  - history
- rapikan error banners yang konsisten
- tambahkan empty state untuk:
  - belum ada decision history
  - wallet belum connect
  - backend tidak reachable

### Files likely involved

- `fe/src/app/page.tsx`
- `fe/src/components/modals.tsx`
- `fe/src/components/agents-page.tsx`

### Done when

- tidak ada state penting yang "diam" saat gagal atau kosong

---

## Task 4: Owner Wallet Guidance

### Why

Vault saat ini single-user owner-based, jadi UX harus sangat jelas saat wallet yang connect bukan owner.

### Work

- tampilkan badge atau notice `Vault Owner` vs `Connected Wallet`
- disable action tertentu jika bukan owner
- tampilkan why action blocked

### Files likely involved

- `fe/src/app/page.tsx`
- `fe/src/components/modals.tsx`

### Done when

- user tidak bingung kenapa deposit/withdraw gagal karena wallet salah

---

## Task 5: Manual Test Checklist UI

### Why

Supaya FE siap demo tanpa trial-and-error.

### Work

- buat `docs` manual checklist kecil untuk FE
- validasi semua flow:
  - connect wallet
  - wrong network
  - faucet
  - deposit
  - withdraw
  - preview
  - execute
  - reject

### Done when

- ada checklist FE yang bisa dijalankan orang lain

---

## P1: Quality and Maintainability

## Task 6: Refactor Data Mapping Layer

### Why

Saat ini transform data hidup cukup banyak di `page.tsx`.

### Work

- pindahkan mapping logic tambahan ke `lib/equinox-ui.ts`
- buat query hooks terpisah jika perlu
- kecilkan tanggung jawab `page.tsx`

### Done when

- `page.tsx` lebih fokus ke composition, bukan ke transform data panjang

---

## Task 7: Component Split for Actions

### Why

Supaya write actions tidak menumpuk di satu file besar.

### Work

- pisahkan action panel dari `page.tsx`
- pisahkan transaction state component
- pisahkan portfolio action controls

### Suggested target files

- `fe/src/components/portfolio-actions.tsx`
- `fe/src/components/tx-status-panel.tsx`
- `fe/src/components/demo-faucet.tsx`

### Done when

- komponen page utama lebih mudah dibaca dan dipelihara

---

## Task 8: Frontend Testing

### Why

FE belum punya automated test coverage.

### Work

- tambahkan unit test minimal untuk helper mapping
- tambahkan integration test untuk action components
- tambahkan E2E plan untuk browser:
  - load app
  - backend reachable
  - action buttons tampil

### Note

Wallet E2E penuh mungkin butuh setup khusus dan tidak harus selesai di tahap awal.

### Done when

- ada minimal test harness untuk FE

---

## P2: Product Maturity

## Task 9: Better Portfolio Analytics UI

### Work

- allocation trend
- market snapshot freshness
- strategy score cards
- blocked decision analytics

### Done when

- FE tidak hanya menampilkan current state, tapi juga decision context dan historical insight

---

## Task 10: Institutional Reporting Surface

### Work

- exportable reports
- AUM / exposure summary
- performance attribution
- risk profile compliance summary

### Done when

- FE bisa menjadi operator console dan stakeholder reporting surface

---

## Dependencies

- `BE` harus stabil untuk response contracts
- `SC` ABI/behavior jangan berubah besar saat FE P0 dijalankan
- `AI` nanti akan menambah reasoning payload yang perlu ditampilkan

---

## Definition of Done for FE

FE dianggap `done` untuk fase berikutnya jika:

- wallet flow lancar
- user bisa top-up, deposit, withdraw tanpa bingung
- tx dan error states jelas
- preview/execute/reject terlihat jelas di UI
- demo flow bisa dipandu sepenuhnya dari FE
