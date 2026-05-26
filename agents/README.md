# Equinox Agent Notes

Folder ini berisi brief singkat untuk agent coding yang mengerjakan Equinox.
Pakai file sesuai area kerja agar output tetap konsisten dengan arah produk dan stack repo.

## Struktur

- `fe.md`: panduan frontend dApp dashboard.
- `be.md`: panduan backend orchestrator dan API.
- `sc.md`: panduan smart contract Foundry.

## Konteks Produk

Equinox RWA adalah portfolio engine untuk Mantle ecosystem yang menggabungkan:

- vault dan risk guardrails on-chain,
- backend orchestrator untuk data, event, dan eksekusi,
- AI/quant reasoning untuk rebalancing lintas aset,
- reputasi agent berbasis standar ERC-8004,
- integrasi yield DeFi Mantle dan CeFi Bybit.

Target demo utama:

1. user connect wallet, deposit, pilih risk profile,
2. agent melakukan rebalance yang transparan,
3. dashboard menampilkan reasoning dan performa,
4. smart contract menolak instruksi yang melanggar risk profile.

## Prinsip Umum

- Prioritaskan demo flow end-to-end daripada fitur yang melebar.
- Jangan hardcode secret, private key, API key, atau RPC credential.
- Pakai data mock yang jelas namanya saat integrasi real belum tersedia.
- Jaga kontrak API antara `fe`, `be`, dan `sc` tetap eksplisit.
- Tambahkan validasi di boundary: input user, request API, dan transaksi contract.
- Kalau mengubah behavior lintas folder, update catatan agent terkait.

## Commands

Frontend:

```bash
cd fe
npm run dev
npm run lint
npm run build
```

Backend:

```bash
cd be
npm run dev
npm run build
```

Smart contracts:

```bash
cd sc
forge build
forge test
```

