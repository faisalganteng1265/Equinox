# Product Design Specification: Equinox RWA

## Monorepo Setup

Repo ini sekarang memakai `pnpm workspace` untuk layer aplikasi JavaScript:

- `fe` -> Next.js frontend
- `be` -> Express backend
- `sc` -> tetap terpisah, tidak masuk workspace `pnpm`, dan tetap dijalankan dengan tool Foundry

### Quick Start

Install dependency frontend dan backend dari root:

```bash
pnpm install
```

Jalankan frontend dan backend bersamaan dari root:

```bash
pnpm dev
```

Jalankan salah satu package saja:

```bash
pnpm dev:fe
pnpm dev:be
```

Atau gunakan filter langsung:

```bash
pnpm --filter @equinox/fe dev
pnpm --filter @equinox/be dev
```

Build dari root:

```bash
pnpm build
pnpm lint
```

### Smart Contract Workspace

Folder `sc` tidak dikelola oleh `pnpm workspace`. Untuk smart contract, tetap gunakan command Foundry dari folder `sc`:

```bash
cd sc
forge build
forge test
```

**Target Network:** Mantle Network (Testnet)

## 1. Identitas Produk

**Nama Produk:** Equinox RWA

**Tagline:** The Institutional-Grade DeFAI Portfolio Engine for Mantle Ecosystem

**One-Liner (Elevator Pitch):**

"Equinox RWA adalah infrastruktur yield management bertenaga AI di jaringan Mantle yang dilengkapi dengan reputasi terverifikasi secara on-chain (berbasis standar ERC-8004). Sistem ini mengotomatisasi penyeimbangan portofolio lintas kelas aset secara dinamis (mETH, USDY, fBTC, MI4), menjembatani likuiditas lintas dunia (DeFi Mantle <-> Bybit CeFi Earn) via Bybit API, serta mengamankan modal pengguna menggunakan batas parameter risiko (Risk-Adjusted Guardrails) yang dieksekusi secara transparan dan terekam penuh di blockchain."

## 2. Masalah & Solusi

| Masalah Utama | Solusi Equinox RWA |
| --- | --- |
| Ketergantungan Aset Tunggal & Efisiensi Rendah<br><br>Kompetitor DeFAI (seperti Giza ARMA) hanya mengoptimalkan satu kelas aset (stablecoin) di kolam lending terbatas, sehingga kehilangan momentum yield dari volatilitas aset utama. | Cross-Asset-Class Optimization Engine:<br><br>Mengoptimalkan alokasi secara simultan lintas aset native terkuat Mantle: liquid staking (mETH), RWA berbasis obligasi AS (USDY), serta eksposur Bitcoin dan indeks (fBTC, MI4). |
| Krisis Kepercayaan Terhadap AI (Black Box)<br><br>Pengguna dipaksa mempercayai keputusan AI off-chain secara buta tanpa adanya rekam jejak performa yang transparan dan tidak dapat dimanipulasi. | ERC-8004 Verifiable Agent Reputation:<br><br>Setiap AI Agent dicetak sebagai NFT identitas unik. Seluruh riwayat hasil yield, tingkat penarikan (drawdown), dan keputusan rebalancing dicatat on-chain untuk membangun skor reputasi yang terverifikasi. |
| Kekakuan Likuiditas On-Chain<br><br>Protokol yield aggregator tradisional terjebak di ekosistem on-chain, kehilangan peluang keuntungan yang lebih tinggi saat platform CeFi menawarkan suku bunga promosi/institusional yang lebih baik. | Cross-World Bridge via Bybit API:<br><br>Konektivitas backend cerdas yang secara otomatis memindahkan aset antara protokol DeFi Mantle (Aave V3, CIAN) dan Bybit CeFi Earn Products berdasarkan kalkulasi selisih keuntungan (rate differential) yang gas-aware. |
| Strategi Agresif yang Buta Risiko (Chasing APY)<br><br>Bot otomatis sering memindahkan modal ke kolam yield tinggi yang tidak likuid atau rentan diretas demi mengejar angka APY tinggi. | Enforced Risk-Adjusted Strategy Profiles:<br><br>AI mengeksekusi penyeimbangan dana di dalam batas ketat profil risiko yang dipilih user (Conservative, Balanced, Aggressive). Kontrak pintar akan menolak instruksi jika alokasi melanggar parameter profil. |

## 3. Arsitektur Sistem & Detail Teknis (Modular Structure)

Sistem ini memisahkan logika matematika off-chain yang kompleks dari penegakan keamanan on-chain melalui tiga lapisan utama:

```text
+-----------------------------------------------------------------+
|                    1. SMART CONTRACT LAYER                      |
|  - MantleVaultOrchestrator.sol      - MantleAgentRegistry8004.sol|
|  - Integrasi: Aave V3, CIAN Vaults                               |
+-----------------------------------------------------------------+
                               ^
                               | (Transaksi Web3 Aman)
                               v
+-----------------------------------------------------------------+
|                   2. BACKEND ORCHESTRATOR                       |
|  - Express.js (Node.js) Engine      - Bybit API Connector        |
|  - RPC Event Listener & Execution Trigger                        |
+-----------------------------------------------------------------+
                               ^
                               | (Sinyal Optimasi & Log Keputusan)
                               v
+-----------------------------------------------------------------+
|                3. STRATEGY & REASONING LAYER                    |
|  - Backend Strategy Engine         - Risk Matrix Controller      |
|  - OpenRouter Reasoning Provider                                 |
+-----------------------------------------------------------------+
```

### A. Layer Smart Contract (Solidity - Mantle Network)

Dibangun menggunakan framework Foundry untuk menjamin keamanan tinggi dan eksekusi pengujian lokal yang komprehensif.

**MantleVaultOrchestrator.sol (Brankas Utama Portofolio):**

Menyimpan aset pengguna secara terpusat (mETH, USDY, fBTC, MI4).

Variabel Kunci: `address public owner`, `address public authorizedAgent`, `uint8 public currentRiskProfile`.

Fungsi `rebalancePortfolio(address[] targets, uint256[] weights)`: Fungsi penyeimbangan aset yang hanya dapat dipicu oleh backend agen yang sah. Sebelum dana ditransfer ke sub-protokol (seperti Aave atau CIAN), fungsi ini melakukan validasi silang ke modul profil risiko untuk memastikan transaksi aman.

**MantleAgentRegistry8004.sol (Mesin Identitas & Reputasi):**

Mengimplementasikan standar ERC-8004 yang didukung penuh oleh Mantle untuk memberikan identitas resmi pada AI Agent.

State: `mapping(uint256 => AgentStats) public agentRegistry` (menyimpan metrik win-rate, total transaksi, historis APY, dan skor reputasi 0-100).

Fungsi `logDecision(uint256 agentId, string memory reasoningHash, bytes memory performanceData)`: Mencatat hash argumen keputusan AI secara permanen di blockchain (on-chain decision logging).

### B. Layer Backend & Reasoning Engine (Express.js & OpenRouter)

Kombinasi performa asinkronus Node.js untuk operasi Web3, strategy logic deterministic di backend, dan provider LLM untuk reasoning yang dapat diaudit.

**mantle-yield-orchestrator (Backend Express.js):**

Bertindak sebagai jembatan operasional utama menggunakan library Viem untuk interaksi dengan blockchain Mantle.

Bybit API Connector: Mengelola modul koneksi terenkripsi ke API institusional Bybit untuk mengecek suku bunga CeFi Earn secara real-time dan mengeksekusi perintah pemindahan dana jika parameter terpenuhi.

Menyediakan REST API internal untuk memperbarui data ke live dashboard antarmuka pengguna.

**strategy-and-reasoning layer (Backend + OpenRouter):**

Backend tetap menghitung target strategi secara deterministic berdasarkan data pasar, batas profil risiko, dan guardrail execution.

Fungsi `evaluate_yield_curves()`: Logika backend secara konstan memetakan kurva yield dari semua instrumen (on-chain & off-chain), menghitung biaya gas riil di Mantle, dan membentuk target rebalancing yang efisien.

Fungsi `generate_reasoning()`: Provider LLM seperti `OpenRouter` mengonversi context strategi dan data risiko menjadi teks narasi natural yang mudah dipahami manusia untuk ditampilkan pada feed dApp.

## 4. Alur Kerja (Skenario Demo Hackathon)

Skenario pembuktian aplikasi untuk Demo Day dirancang guna memperlihatkan keunggulan sistem dalam 4 babak dramatis:

### 1. Tahap Setup & Pendelegasian Parameter (User Interface)

**Aksi:** Pengguna masuk ke dApp Equinox, menghubungkan dompet, mendepositkan modal berupa USDY, dan memilih profil risiko "Balanced".

**On-Chain:** Sistem mencetak NFT ERC-8004 sebagai identitas agen baru yang ditugaskan khusus untuk mengelola brankas user. Kontrak mengunci batas alokasi profil Balanced secara permanen di blockchain.

### 2. Skenario Eksekusi Otonom (Normal Operation)

**Aksi:** Suku bunga dasar obligasi AS pada token USDY turun, sementara insentif pool mETH di ekosistem DeFi Mantle melonjak.

**Eksekusi:** Backend strategy engine mendeteksi anomali ini, menghitung efisiensi gas, dan mengeksekusi rebalancing. Layer reasoning kemudian menjelaskan keputusan tersebut ke pengguna. Dana dipindahkan secara otonom dari USDY ke mETH.

**Hasil:** Keputusan dicatat via ERC-8004, dan dashboard memperlihatkan "Agent Reasoning Feed" secara real-time. Juri dapat melihat transparansi logika AI secara langsung.

### 3. Jembatan Lintas Dunia (CeFi <-> DeFi Pivot)

**Aksi:** Terjadi kejenuhan yield masif di seluruh ekosistem on-chain Mantle (DeFi APY merosot hingga 3.2%).

**Eksekusi:** Melalui Bybit API, agen mendeteksi bahwa Bybit CeFi Earn menawarkan suku bunga mETH sebesar 4.8%. Agen memicu penarikan likuiditas dari on-chain, memindahkannya ke sistem kustodian Bybit melalui API yang aman.

**Hasil:** Integrasi Bybit API sukses terdemonstrasikan, membuktikan kapabilitas cross-world yield arbitrage yang tidak dimiliki kompetitor manapun.

### 4. Uji Penahanan Batas Risiko (The Shield Activates / Climax Demo)

**Aksi:** Terjadi simulasi serangan Prompt Injection pada backend AI, atau kondisi pasar ekstrim yang membuat model AI mengalami halusinasi dan mencoba mengalokasikan 90% dana ke aset berisiko tinggi (fBTC leverage) demi mengejar APY kilat.

**Eksekusi:** Instruksi transaksi dikirim ke MantleVaultOrchestrator.sol. Namun, karena user mengunci profil di mode "Balanced", interseptor smart contract mendeteksi bahwa batas alokasi fBTC melanggar batas maksimum aman profil tersebut.

**Hasil:** Transaksi otomatis di-revert di level blockchain. Dana pengguna tetap aman, dan dasbor memicu peringatan merah: "Transaction Blocked: Risk Profile Constraints Violated." Keamanan arsitektur terbukti 100% aman di hadapan juri.

## 5. Tech Stack & Partner Integrations

| Komponen | Teknologi yang Digunakan | Peran dalam Proyek |
| --- | --- | --- |
| Smart Contracts & Testing | Foundry, Solidity | Kompilasi super cepat untuk logika penguncian aset, pengujian fungsionalitas brankas utama, dan manajemen parameter profil risiko. |
| Agent Standards | ERC-8004 (Mantle Tech Stack) | Menyediakan kerangka NFT Identitas, Reputasi, dan Validasi resmi untuk mencatat historical performance agen secara terverifikasi. |
| Web3 Client Engine | Viem, TypeScript | Library berkinerja tinggi untuk mendengarkan RPC event Mantle, merakit transaksi, dan berinteraksi secara aman dari backend ke smart contract. |
| CeFi Integrator | Bybit API | Menghubungkan ekosistem backend ke bursa Bybit untuk membaca data suku bunga Earn dan memindahkan likuiditas secara hibrida. |
| Backend Orchestrator | Express.js & Node.js | Pusat kendali operasional, bertindak sebagai agregator data, menangani otentikasi API, dan menyajikan data real-time ke dasbor aplikasi. |
| Strategy & Reasoning Layer | Express.js, TypeScript, OpenRouter | Backend menghitung target strategi secara deterministic, lalu provider reasoning menghasilkan penjelasan natural-language, confidence summary, dan konteks keputusan agen. |
| Target Network | Mantle Network | Menyediakan finalitas transaksi instan, biaya gas ultra-murah, akses langsung ke likuiditas mETH/USDY, serta pemenuhan syarat utama track AI x RWA. |
