# FE Manual Test Checklist

## Goal

Checklist ini dipakai untuk memvalidasi `fe` Equinox terhadap `be` dan `sc` yang sudah live di Mantle Sepolia.

---

## Preconditions

- `be` berjalan dan `GET /health` mengembalikan `status: ok`
- `fe` berjalan lokal
- wallet tester sudah ditambahkan ke browser
- wallet tester berada di `Mantle Sepolia`
- `WRITE_API_KEY` FE cocok dengan backend jika endpoint write dikunci
- address kontrak di backend menunjuk deployment Mantle Sepolia terbaru

---

## Test 1: App Boot

### Steps

1. Buka halaman utama FE.
2. Tunggu data awal termuat.

### Expected

- halaman render tanpa crash
- tidak ada section kosong karena fetch gagal
- status vault, portfolio, topology, dan agent panel tampil

---

## Test 2: Connect Wallet

### Steps

1. Klik tombol connect wallet.
2. Pilih wallet via `RainbowKit`.
3. Approve koneksi.

### Expected

- address wallet tampil di top bar
- state connected terbaca di panel utama
- tidak ada error hydration atau modal wallet rusak

---

## Test 3: Wrong Network Handling

### Steps

1. Ganti wallet ke chain selain `Mantle Sepolia`.
2. Kembali ke FE.

### Expected

- FE memberi sinyal jaringan salah atau memicu switch chain flow
- action on-chain tidak bisa dijalankan sebelum kembali ke `Mantle Sepolia`

---

## Test 4: Faucet Demo Mint

### Steps

1. Connect wallet yang dipakai sebagai `VAULT_OWNER`.
2. Klik tombol faucet.
3. Mint `USDY`.

### Expected

- request ke backend sukses
- muncul tx hash dan explorer link
- saldo token owner bertambah
- setelah refresh state, amount baru terbaca oleh FE

---

## Test 5: Deposit

### Steps

1. Buka modal deposit.
2. Pilih asset yang didukung.
3. Masukkan nominal valid.
4. Lanjut sampai review.
5. Submit seluruh transaction plan.

### Expected

- review step menampilkan owner wallet, asset, amount, dan estimasi gas
- bila allowance kurang, flow approve muncul lebih dulu
- tx status berubah sampai confirmed
- explorer link tx bisa dibuka
- exposure asset pada vault bertambah setelah refresh

---

## Test 6: Withdraw

### Steps

1. Buka modal withdraw.
2. Pilih asset dengan exposure > 0.
3. Masukkan amount yang valid.
4. Submit.

### Expected

- withdraw tx confirmed
- explorer link tersedia
- saldo wallet penerima bertambah
- exposure vault berkurang setelah refresh

---

## Test 7: Preview Rebalance

### Steps

1. Pilih profile atau target rebalance yang tersedia di UI.
2. Jalankan preview.

### Expected

- FE menampilkan hasil preview dari backend, bukan data lokal palsu
- jika target valid, preview status `ok`
- jika target melanggar guardrail, reason tampil jelas

---

## Test 8: Execute Rebalance

### Steps

1. Jalankan preview valid.
2. Lanjutkan ke execute.

### Expected

- backend mengirim tx `executeRebalance`
- tx hash tampil di UI
- explorer link aktif
- topology, allocation, dan decision feed berubah setelah refresh

---

## Test 9: Reject Rebalance

### Steps

1. Buat target rebalance yang sengaja invalid.
2. Jalankan preview.
3. Rekam rejected decision dari UI.

### Expected

- backend mengirim tx `recordRejectedDecision`
- tx hash tampil di UI
- agent decision feed menampilkan blocked decision terbaru
- portfolio exposure tidak berubah

---

## Test 10: Agent and Explorer Surfaces

### Steps

1. Buka section agent dan strategy.
2. Klik link explorer untuk:
   - agent registry
   - asset address
   - adapter address
   - tx hash yang tersedia

### Expected

- semua link terbuka ke Mantle Explorer yang benar
- tidak ada tombol explorer yang kosong atau tidak bereaksi

---

## Test 11: Mobile Pass

### Steps

1. Buka FE pada viewport sempit atau device emulator.
2. Ulangi flow baca data, faucet, deposit modal, dan agent page.

### Expected

- top bar wrap dengan aman
- grid portfolio tidak pecah
- table horizontal bisa discroll
- modal tetap bisa dipakai tanpa konten terpotong

---

## Regression Notes

Catat hal berikut setelah setiap sesi testing:

- commit yang diuji
- chain RPC yang dipakai
- wallet address tester
- endpoint yang gagal
- tx hash jika ada
- screenshot jika bug terlihat di UI
