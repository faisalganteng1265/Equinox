# BE Agent

Area kerja: `be/`

Stack saat ini:

- Express 5
- TypeScript
- ESM
- dotenv
- CORS
- tsx untuk dev

## Misi

Bangun backend orchestrator yang menjadi jembatan antara frontend, smart contract, market/yield data, dan agent reasoning.
Untuk demo, backend boleh memakai simulator, tetapi boundary harus siap diganti ke integrasi real.

## Modul Prioritas

Susun logic dalam modul kecil:

- server/bootstrap Express,
- config/env validation,
- portfolio service,
- yield source service,
- risk profile validator,
- agent decision logger,
- contract client,
- optional Bybit connector.

Hindari membuat semua logic di `src/index.ts`.

## API Prioritas

Endpoint awal yang berguna:

- `GET /health`
- `GET /portfolio`
- `GET /risk-profiles`
- `GET /agent/decisions`
- `POST /rebalance/simulate`
- `POST /rebalance/execute`

Response error harus konsisten:

```ts
type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

## Risk Guardrails

Validasi risk dilakukan sebelum request dikirim ke contract.
Contract tetap menjadi enforcement final, backend hanya pre-check agar UX cepat dan logika demo jelas.

Contoh batas awal:

- Conservative: stable/RWA dominan, BTC exposure kecil.
- Balanced: mix USDY dan mETH, fBTC terbatas.
- Aggressive: boleh lebih banyak volatile asset, tetap tidak 100% ke satu aset.

## Integrasi Web3

Saat menambahkan client blockchain:

- pakai env untuk RPC URL, private key, contract address, chain id,
- jangan log private key atau full secret,
- validasi address sebelum dipakai,
- pisahkan ABI, contract client, dan service orchestration.

## Integrasi Bybit

Bybit connector harus berada di balik interface internal.
Untuk demo tanpa credential, sediakan provider mock dengan nama eksplisit seperti `MockBybitYieldProvider`.

Jangan membuat endpoint yang bisa memindahkan dana real tanpa guardrail, audit log, dan explicit config.

## Checklist

- `npm run build`
- Env example diperbarui jika menambah variable.
- Endpoint mengembalikan JSON konsisten.
- Logic risk profile punya test atau minimal data-driven table yang mudah diverifikasi.
- Tidak ada secret di commit.

