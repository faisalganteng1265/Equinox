# AI Task Breakdown

## Goal

Membuat folder `ai/` dan service AI/quant Equinox yang:

- menghasilkan target portfolio
- menghitung risk-aware strategy output
- membuat reasoning yang bisa diaudit
- menyuplai backend dengan keputusan yang konsisten

---

## Current State

### Faktanya sekarang

- folder `ai/` belum ada
- belum ada Python service
- belum ada optimizer implementation
- belum ada reasoning generator
- belum ada contract resmi antara backend dan AI service

Artinya, `AI` saat ini masih konsep arsitektur, belum modul implementasi.

---

## Proposed Folder Shape

```text
ai/
  README.md
  pyproject.toml
  src/
    app.py
    config/
    domain/
    services/
    adapters/
    models/
    pipelines/
  tests/
```

### Suggested responsibilities

- `domain/`
  - yield evaluation rules
  - risk rules
  - allocation logic

- `services/`
  - rebalance planner
  - reasoning generator
  - confidence evaluator

- `adapters/`
  - market data client
  - backend API client

- `pipelines/`
  - scheduled run
  - one-shot simulation

---

## P0: Define the Service Boundary

## Task 1: Create the `ai/` Folder and Project Skeleton

### Work

- buat folder `ai/`
- pilih packaging Python
- tambahkan README dasar
- tetapkan command local run and test

### Done when

- service punya bentuk project yang jelas

---

## Task 2: Define BE <-> AI Contract

### Work

- tentukan payload input:
  - portfolio state
  - asset metadata
  - adapter snapshots
  - prices
  - current risk profile
- tentukan payload output:
  - proposed targets
  - reasoning payload
  - confidence
  - risk summary
  - execution recommendation

### Done when

- backend bisa memanggil AI service lewat contract yang stabil

---

## Task 3: Reasoning Payload Design

### Work

- tentukan format reasoning terstruktur
- pisahkan:
  - human-readable explanation
  - machine-readable evidence
  - source references

### Done when

- reasoning hash on-chain punya payload off-chain yang berguna dan konsisten

---

## P1: First Working Engine

## Task 4: Rule-Based Rebalance Planner MVP

### Why

Jangan langsung lompat ke AI yang rumit. Mulai dari engine deterministic yang bisa diaudit.

### Work

- implement planner sederhana:
  - bandingkan APY
  - cek risk score
  - cek liquidity score
  - hasilkan target allocation berdasarkan profile

### Done when

- engine bisa menghasilkan target yang konsisten dari input snapshot

---

## Task 5: Risk Matrix Controller MVP

### Work

- definisikan scoring logic
- buat rule untuk:
  - APY attractiveness
  - liquidity penalty
  - risk penalty
  - volatility penalty

### Done when

- planner tidak hanya mengejar APY mentah

---

## Task 6: Reasoning Generator MVP

### Work

- konversi output planner menjadi teks penjelasan yang masuk akal
- sertakan evidence ringkas:
  - old allocation
  - new allocation
  - source metrics

### Done when

- setiap keputusan punya narasi yang cukup untuk FE dan audit log

---

## P2: Production-Like AI Layer

## Task 7: Real Market Data Integration

### Work

- baca data real dari source yang dipilih
- normalisasi ke schema internal
- scoring berdasarkan data nyata, bukan manual snapshot saja

### Done when

- AI engine bisa berjalan di atas data real

---

## Task 8: Simulation and Backtesting

### Work

- buat mode replay/backtest
- evaluasi keputusan engine terhadap historical snapshots
- ukur:
  - return
  - drawdown
  - decision frequency
  - blocked decision rate

### Done when

- engine tidak hanya "terdengar masuk akal", tapi juga terukur

---

## Task 9: Confidence and Safety Layer

### Work

- tambahkan confidence score
- jika confidence rendah, hasilkan `hold` atau `manual review`
- tentukan kapan AI tidak boleh menyarankan execute

### Done when

- AI tidak memaksa action di kondisi yang tidak pasti

---

## P3: Institutional Path

## Task 10: Explainability and Audit Package

### Work

- simpan full reasoning artifacts
- simpan source trace
- siapkan exportable decision packets

### Done when

- setiap keputusan dapat diaudit oleh pihak internal atau eksternal

---

## Task 11: Model Governance

### Work

- versioning strategy logic
- approval flow untuk perubahan model/rule
- changelog antar engine version

### Done when

- perubahan AI logic tidak liar dan bisa ditelusuri

---

## Dependencies

- `BE` wajib mendefinisikan integration contract
- `SC` memberikan execution envelope dan guardrail semantics
- `FE` akan mengkonsumsi reasoning output dan confidence data

---

## Definition of Done for AI

AI dianggap `done` untuk fase berikutnya jika:

- ada folder service nyata
- input/output contract stabil
- planner MVP jalan
- reasoning generator jalan
- backend bisa memakai output AI untuk preview and execute loop
