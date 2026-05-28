# AI Task Breakdown

## Goal

Menetapkan jalur AI Equinox yang ringan dan pragmatis:

- tidak memakai service Python terpisah
- tidak memindahkan strategy logic keluar dari backend
- memakai `OpenRouter` hanya untuk reasoning, summarization, dan confidence
- menjaga `BE + SC` sebagai guardrail final

---

## Current State

### Sudah diputuskan dan diimplementasi

- folder `ai/` terpisah dihapus sejak awal
- strategy calculation tetap di backend (`strategy.ts`)
- OpenRouter dipanggil dari backend (`reasoning.ts`)
- tidak ada HTTP boundary BE <-> Python AI service
- tidak ada kebutuhan deploy service AI tersendiri
- reasoning menjadi sub-layer di backend, bukan subsystem terpisah

### Yang sudah live

- `reasoning.ts`: client OpenRouter dengan prompt engineering, parsing response, dan fallback
- `strategy.ts`: kalkulasi target weights deterministic dari risk profile
- Reasoning text dikirim ke FE via on-chain `detailsURI`
- FE menampilkan reasoning text langsung di agent decision feed
- API key `OPENROUTER_API_KEY` dikonfigurasi, model `openai/gpt-4o-mini`

---

## P1: Reasoning Integration

## Task 1: Define Reasoning Scope

**Status: ✅ DONE**

### Boundary yang sudah ditetapkan

Provider hanya menghasilkan:
- narrative explanation (max 180 kata)
- confidence score (0-100)

Provider tidak menjadi sumber target weights — itu tetap dari `strategy.ts` secara deterministic.

---

## Task 2: Prompt and Output Contract

**Status: ✅ DONE**

### Input context yang dikirim ke OpenRouter

- vault address (dipendek)
- risk profile (Conservative/Balanced/Aggressive)
- total portfolio value
- per-asset: current weight % → target weight %, APY, venue
- max allocation drift %

### Output yang dihasilkan

- `text`: narasi natural language penjelasan keputusan rebalance
- `confidence`: integer 0-100
- `payload`: full context + model + timestamp (di-hash untuk on-chain)

---

## Task 3: Fallback and Safety Rules

**Status: ✅ DONE**

### Fallback behavior

- jika `OPENROUTER_API_KEY` tidak di-set → fallback deterministik otomatis
- jika request timeout (8 detik) → fallback deterministik
- jika response tidak valid → fallback deterministik
- fallback menghasilkan teks yang bermakna (bukan error string)
- orchestrator tidak berhenti karena reasoning gagal

---

## Task 4: Richer Explainability

**Status: ✅ DONE**

### Apa yang sudah ada

- reasoning text langsung ditampilkan di FE agent feed (bukan hash mentah)
- teks dari OpenRouter/fallback tersimpan on-chain via `detailsURI`
- FE `buildDecisionFeed` menampilkan `decision.detailsURI` jika ada
- untuk blocked decision: teks reasoning juga dicatat on-chain

---

## Task 5: Real Data Context untuk Reasoning

**Status: ✅ DONE (bonus)**

### Apa yang sudah ada

Prompt ke OpenRouter memakai data APY nyata:
- USDY APY dari US Treasury T-Bill rate
- mETH APY dari DeFiLlama
- fBTC APY dari Bybit Flexible Savings
- MI4 APY dari Mantle DeFi pools median

Ini membuat reasoning dari LLM lebih akurat dan dapat diverifikasi.

---

## P2: Product-Level Reasoning

## Task 6: Confidence Layer

**Status: ⏳ Phase 2**

Saat ini confidence score dihasilkan tapi belum ditampilkan di FE secara eksplisit. Phase 2: tampilkan confidence indicator di setiap decision entry, dengan label `clear` / `cautious` / `manual review`.

---

## Definition of Done untuk AI (Hackathon Scope)

- ✅ OpenRouter integration di backend
- ✅ Output reasoning stabil dan ter-parse
- ✅ Strategy logic tetap deterministic di backend
- ✅ FE menampilkan reasoning text dari LLM
- ✅ Fallback safety: sistem tetap jalan walau provider gagal
- ✅ Real market data sebagai context untuk reasoning
