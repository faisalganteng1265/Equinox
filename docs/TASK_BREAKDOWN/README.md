# Equinox Task Breakdown

Dokumen ini memecah roadmap Equinox menjadi task breakdown yang bisa dieksekusi per folder:

- [FE.md](C:/Users/bagas/Downloads/Dapp%20Project/Equinox/docs/TASK_BREAKDOWN/FE.md)
- [BE.md](C:/Users/bagas/Downloads/Dapp%20Project/Equinox/docs/TASK_BREAKDOWN/BE.md)
- [SC.md](C:/Users/bagas/Downloads/Dapp%20Project/Equinox/docs/TASK_BREAKDOWN/SC.md)
- [AI.md](C:/Users/bagas/Downloads/Dapp%20Project/Equinox/docs/TASK_BREAKDOWN/AI.md)

Dokumen ini adalah turunan yang lebih operasional dari [ROADMAP_GAP_TO_FINAL.md](C:/Users/bagas/Downloads/Dapp%20Project/Equinox/docs/ROADMAP_GAP_TO_FINAL.md).

---

## Cara Pakai

1. Mulai dari file folder yang sedang dikerjakan.
2. Kerjakan `P0` lebih dulu.
3. Jangan naik ke `P1` atau `P2` sebelum `Definition of Done` untuk `P0` terpenuhi.
4. Gunakan bagian `Dependencies` untuk tahu task mana yang memblokir task lain.
5. Setelah satu blok selesai, update status di dokumen ini atau pindahkan ke issue tracker.

---

## Status Repo Saat Ini

### FE

- sudah wired ke `BE` dan `SC`
- wallet connect sudah pakai `RainbowKit`
- deposit/withdraw sudah ada
- preview/execute/reject sudah ada
- butuh polish, faucet UX, testing, dan explorer UX

### BE

- sudah bisa baca state live
- sudah bisa operator write action
- belum ada scheduler
- belum ada database/persistence
- belum ada automated strategy loop
- belum ada test suite formal

### SC

- sudah deploy di `Mantle Sepolia`
- mock ecosystem sudah hidup
- risk guardrails dan agent logging sudah nyata
- belum ada adapter produksi
- belum ada audit hardening penuh

### AI

- belum ada folder implementasi
- belum ada Python engine
- baru ada kebutuhan arsitektural di product design dan roadmap

---

## Critical Sequence

Urutan kerja paling rasional dari kondisi saat ini:

1. `FE P0`
   Tujuannya: demo dan testing flow jadi mulus.

2. `BE P0`
   Tujuannya: backend stabil, auth rapi, logging rapi, data contract stabil.

3. `AI P0`
   Tujuannya: definisikan service shape, contract, dan data flow.

4. `BE P1 + AI P1`
   Tujuannya: hidupkan automation loop dan reasoning pipeline.

5. `SC P0/P1`
   Tujuannya: harden mock execution, tambah test depth, rapikan read helpers.

6. `SC P2 + BE P2 + AI P2`
   Tujuannya: bergerak ke adapter nyata, real data ops, dan mainnet readiness.

---

## Parallel Work Guidance

### Aman diparalelkan

- `FE P0` dan `SC P0`
- `BE P0` dan `SC P0`
- `AI P0` dan `BE P0`

### Jangan diparalelkan tanpa sinkronisasi kuat

- perubahan shape response `BE` sambil FE sedang wiring besar
- perubahan ABI / contract method `SC` saat FE write flow belum stabil
- automation logic `BE` sebelum contract risk semantics benar-benar final

---

## Folder Ownership Suggestion

### `fe/`

Fokus pada:

- user experience
- wallet flow
- dashboard state
- explorer and tx visibility
- manual and E2E testability

### `be/`

Fokus pada:

- orchestration
- read/write contract interface
- auth
- automation scheduler
- data persistence
- integrations

### `sc/`

Fokus pada:

- custody and guardrails
- adapter interface
- on-chain invariants
- security hardening
- deployment discipline

### `ai/`

Fokus pada:

- yield evaluation
- risk scoring
- target generation
- reasoning generation
- explainability payloads

---

## Suggested Milestone Labels

Gunakan label ini kalau ingin memecah menjadi issue atau task board:

- `M0-demo-stability`
- `M1-backend-hardening`
- `M2-ai-service-foundation`
- `M3-automation-loop`
- `M4-real-data-snapshots`
- `M5-protocol-integration`
- `M6-mainnet-readiness`
- `M7-institutional-controls`

---

## Success Condition

Task breakdown ini dianggap berhasil dipakai kalau:

- setiap folder punya task order yang jelas
- tidak ada kebingungan "habis ini ngerjain apa"
- blocker lintas folder terlihat lebih awal
- tim bisa mengeksekusi per folder tanpa harus membaca roadmap besar berulang-ulang
