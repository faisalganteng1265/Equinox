# AI Task Breakdown

## Goal

Menetapkan jalur AI Equinox yang ringan dan pragmatis:

- tidak memakai service Python terpisah
- tidak memindahkan strategy logic keluar dari backend
- memakai `OpenRouter` hanya untuk reasoning, summarization, dan confidence
- menjaga `BE + SC` sebagai guardrail final

---

## Current State

### Sudah diputuskan

- folder `ai/` terpisah dihapus
- strategy calculation tetap di backend
- AI provider akan dipanggil dari backend
- provider yang diincar saat ini adalah `OpenRouter`

### Artinya

- tidak ada lagi HTTP boundary `BE <-> Python AI service`
- tidak ada lagi kebutuhan deploy service AI tersendiri
- reasoning menjadi sub-layer di backend, bukan subsystem terpisah

---

## P1: Reasoning Integration

## Task 1: Define Reasoning Scope

### Work

- tetapkan bahwa provider hanya menghasilkan:
  - narrative explanation
  - confidence summary
  - short risk commentary
- tetapkan bahwa provider tidak menjadi sumber angka target final

### Done when

- boundary AI tidak ambigu

---

## Task 2: Prompt and Output Contract

### Work

- definisikan input context:
  - current vault state
  - market snapshots
  - chosen targets dari backend
  - current risk profile
- definisikan output schema:
  - headline
  - details
  - confidence
  - evidence summary

### Done when

- backend bisa mem-parse reasoning secara stabil

---

## Task 3: Fallback and Safety Rules

### Work

- reasoning provider failure tidak boleh memblok execution engine sepenuhnya
- tentukan fallback copy saat provider timeout atau invalid output
- tetapkan logging untuk prompt/input/output ringkas

### Done when

- system tetap stabil walau provider LLM gagal

---

## P2: Product-Level Reasoning

## Task 4: Richer Explainability

### Work

- buat explanation lebih kaya
- tambahkan evidence yang mudah ditampilkan FE
- tambahkan blocked-decision commentary yang konsisten

### Done when

- FE bisa menunjukkan alasan keputusan dengan jelas

---

## Task 5: Confidence Layer

### Work

- gunakan model output untuk confidence commentary
- pertimbangkan kapan hasil diberi label:
  - `clear`
  - `cautious`
  - `manual review`

### Done when

- reasoning terasa lebih operasional, bukan sekadar teks cantik

---

## Definition of Done for AI

AI dianggap siap ke fase berikutnya jika:

- `OpenRouter` integration ada di backend
- output reasoning stabil dan ter-parse
- strategy logic utama tetap deterministic di backend
- FE bisa mengonsumsi reasoning tanpa ketergantungan pada service Python terpisah
