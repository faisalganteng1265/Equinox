# FE Agent

Area kerja: `fe/`

Stack saat ini:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint Next config

## Misi

Bangun dApp dashboard Equinox yang terasa seperti produk DeFi institusional:

- ringkas untuk demo,
- jelas untuk juri,
- kuat secara visual tanpa terasa seperti landing page kosong,
- fokus pada portfolio, risk profile, agent reasoning, dan status transaksi.

## UI Prioritas

Halaman utama sebaiknya langsung menjadi app dashboard, bukan marketing page.
Tampilkan minimal:

- wallet/connect state,
- portfolio allocation untuk mETH, USDY, fBTC, dan MI4,
- risk profile selector: Conservative, Balanced, Aggressive,
- agent reasoning feed,
- action/status panel untuk deposit, rebalance, dan blocked transaction,
- indikator target network Mantle testnet.

## Kontrak Data

Saat backend belum siap, gunakan mock data yang bentuknya mudah diganti:

```ts
type RiskProfile = "conservative" | "balanced" | "aggressive";

type Allocation = {
  symbol: "mETH" | "USDY" | "fBTC" | "MI4";
  weight: number;
  apy: number;
  risk: "low" | "medium" | "high";
};

type AgentDecision = {
  id: string;
  timestamp: string;
  status: "proposed" | "executed" | "blocked";
  summary: string;
  reasoning: string;
  txHash?: string;
};
```

## Design Rules

- Pakai layout dashboard padat dan mudah discan.
- Hindari hero marketing yang terlalu besar.
- Jangan menaruh card di dalam card.
- Gunakan state visual yang jelas untuk `executed`, `pending`, dan `blocked`.
- Pastikan mobile tetap usable: portfolio, risk profile, dan feed tidak overlap.
- Teks dalam tombol harus pendek dan tidak pecah aneh.

## Integrasi

Saat API backend tersedia, panggil endpoint dari satu layer kecil, misalnya `lib/api.ts`.
Jangan sebar `fetch()` mentah di banyak komponen.

Endpoint yang masuk akal untuk disiapkan:

- `GET /health`
- `GET /portfolio`
- `GET /agent/decisions`
- `POST /rebalance/simulate`
- `POST /rebalance/execute`

## Checklist

- `npm run lint`
- `npm run build`
- Tidak ada secret di client bundle.
- Empty, loading, success, error, dan blocked states terlihat jelas.
- Copywriting dashboard selaras dengan Equinox RWA, Mantle, risk guardrails, dan agent reputation.

