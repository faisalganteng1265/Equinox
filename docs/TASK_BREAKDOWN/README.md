# Equinox Task Breakdown

Dokumen ini memecah roadmap Equinox menjadi task breakdown per area utama:

- [FE.md](C:/Users/bagas/Downloads/Dapp%20Project/Equinox/docs/TASK_BREAKDOWN/FE.md)
- [BE.md](C:/Users/bagas/Downloads/Dapp%20Project/Equinox/docs/TASK_BREAKDOWN/BE.md)
- [SC.md](C:/Users/bagas/Downloads/Dapp%20Project/Equinox/docs/TASK_BREAKDOWN/SC.md)
- [AI.md](C:/Users/bagas/Downloads/Dapp%20Project/Equinox/docs/TASK_BREAKDOWN/AI.md)

Ini adalah breakdown operasional dari [ROADMAP_GAP_TO_FINAL.md](C:/Users/bagas/Downloads/Dapp%20Project/Equinox/docs/ROADMAP_GAP_TO_FINAL.md).

---

## Repo Status Sekarang

### FE

- wallet flow, faucet, deposit, withdraw, preview, execute, dan reject sudah hidup
- explorer deep link sudah menyentuh tx, registry, asset, dan adapter surfaces
- responsive pass dasar sudah beres
- checklist manual ada di [FE_MANUAL_TEST_CHECKLIST.md](C:/Users/bagas/Downloads/Dapp%20Project/Equinox/docs/FE_MANUAL_TEST_CHECKLIST.md)

### BE

- env validation sudah fail-fast
- error contract sudah stabil dengan `reason` machine-readable
- request correlation dan structured logging sudah ada
- retry/timeout RPC dasar sudah ada
- smoke test backend sudah ada
- strategy logic tetap berada di backend

### SC

- fuzz test sudah bertambah
- invariant suite sudah hidup
- gas report baseline sudah ada
- deployment export artifact sudah ada

### AI / Reasoning

- tidak ada lagi service Python terpisah
- arah terbaru adalah `OpenRouter` untuk reasoning only
- strategy calculation tetap berada di backend
- reasoning nantinya dihasilkan dari backend melalui provider LLM, bukan service `ai/` terpisah

---

## P0 Status

- `FE P0`: selesai
- `BE P0`: selesai
- `SC P0`: selesai
- `AI architecture decision P0`: selesai

Artinya, Equinox sekarang sudah melewati fase wiring awal dan masuk ke fase `P1 execution`.

---

## Next Critical Sequence

Urutan paling rasional setelah semua `P0` ditutup:

1. `BE P1`
   Tujuannya: split domain modules, persistence, scheduler, dan strategy loop.

2. `Reasoning P1`
   Tujuannya: tambahkan `OpenRouter` reasoning layer di backend tanpa memindahkan strategy logic keluar dari `BE`.

3. `FE P1`
   Tujuannya: refactor page composition, tambah automated FE testing, dan siapkan surface reasoning yang lebih kaya.

4. `SC P1`
   Tujuannya: read helper yang lebih ramah FE/BE, audit-prep docs, dan review interface adapter untuk venue nyata.

5. `BE P2 + SC P2`
   Tujuannya: real market data, protocol integration path, emergency/admin hardening, dan mainnet readiness.

---

## Parallel Work Guidance

### Aman diparalelkan

- `FE P1` dan `BE P1`
- `SC P1` dan `BE P1`
- `Reasoning P1` dan `FE P1`

### Butuh sinkronisasi ketat

- perubahan shape response `BE` sambil FE membangun automated tests
- perubahan prompt/response reasoning saat FE mulai menampilkan explainability surface
- perubahan ABI atau helper view `SC` saat FE/BE sedang mengunci contract read path

---

## Suggested Milestone Labels

- `M0-demo-stability`
- `M1-p0-complete`
- `M2-backend-foundation`
- `M3-openrouter-reasoning`
- `M4-automation-loop`
- `M5-real-data-snapshots`
- `M6-smart-contract-audit-prep`
- `M7-protocol-integration`
- `M8-mainnet-readiness`
- `M9-institutional-controls`
