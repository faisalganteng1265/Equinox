# Equinox Frontend

Frontend Next.js untuk Equinox, dashboard AI-native RWA portfolio management di atas Mantle. FE ini sekarang membaca state live dari backend Equinox, memakai RainbowKit untuk connect wallet, dan memakai Mantle SDK untuk estimasi gas Mantle L2 pada flow deposit/withdraw.

## Tech Stack

- Next.js 16 dengan App Router
- React 19
- TypeScript
- RainbowKit + wagmi + viem
- `@mantleio/sdk`
- Tailwind CSS 4
- ESLint 9 dengan konfigurasi Next.js

## Getting Started

Install dependencies dari root workspace:

```bash
pnpm install
```

Siapkan env frontend:

```bash
copy fe\.env.example fe\.env.local
```

Isi minimal:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `EQUINOX_API_ORIGIN`
- `EQUINOX_WRITE_API_KEY` jika backend write endpoints dikunci

Pastikan backend Equinox juga sudah berjalan di `http://localhost:4000` atau sesuaikan `EQUINOX_API_ORIGIN`.

Jalankan frontend dari root:

```bash
pnpm dev:fe
```

Atau dari package frontend langsung:

```bash
pnpm --filter @equinox/fe dev
```

Buka `http://localhost:3000` di browser.

## Required Flow

Untuk testing end-to-end:

1. Jalankan `be` terlebih dahulu.
2. Jalankan `fe`.
3. Connect owner wallet di Mantle Sepolia via RainbowKit.
4. Gunakan modal `Deposit` atau `Withdraw` untuk transaksi langsung ke vault.
5. Gunakan tombol `Preview plan`, `Execute plan`, dan `Record blocked` untuk menguji flow agent melalui backend.

## Scripts

```bash
pnpm --filter @equinox/fe dev
pnpm --filter @equinox/fe build
pnpm --filter @equinox/fe start
pnpm --filter @equinox/fe lint
```

- `dev`: menjalankan Next.js development server.
- `build`: membuat production build.
- `start`: menjalankan production server setelah build.
- `lint`: menjalankan ESLint untuk frontend.

## Project Structure

```text
src/app/
  globals.css       Global theme, layout primitives, component utility classes
  providers.tsx     RainbowKit, wagmi, and React Query providers
  layout.tsx        Root metadata, fonts, and HTML shell
  page.tsx          Main Equinox dashboard app shell
  api/equinox       Local proxy route to backend Equinox API
  api/mantle/gas    Mantle SDK gas estimation endpoint

src/components/
  agents-page.tsx   Agent registry, strategy, and history views
  charts.tsx        Donut, area, sparkline, and allocation charts
  icons.tsx         Local icon renderer used by dashboard controls
  modals.tsx        Live vault deposit/withdraw and risk shield modals
  tweaks-panel.tsx  Floating demo controls for theme/accent/profile
  v2-hero.tsx       Top navigation and memo hero
  v2-pieces.tsx     Portfolio cards, risk dial, ticker, and feed stream
  v2-topology.tsx   Capital topology visualization
  wallet-button.tsx RainbowKit custom topbar button

src/lib/
  abis.ts           Minimal ABI surface for user wallet actions
  chains.ts         Mantle Sepolia chain config
  data.ts           UI types, risk profiles, static feed, and fallback agents
  equinox-api.ts    Browser client for FE proxy routes
  equinox-types.ts  Backend response contracts for FE
  equinox-ui.ts     Mapping live backend payloads into dashboard UI shapes
  wagmi.ts          RainbowKit and wagmi client config
```

## Current UX

- Portfolio page with live NAV, live asset exposures, Mantle wallet actions, agent controls, and decision ticker.
- Agent page for ERC-8004-style identity and agent metadata.
- Strategy page for active mock adapters plus CeFi simulation rows.
- History page backed by live decision data plus local demo events.
- Floating tweaks panel for dark/light theme, accent color, agent tone, and risk profile.

## Validation

Run these before opening a PR or pushing larger changes:

```bash
pnpm --filter @equinox/fe lint
pnpm --filter @equinox/fe build
```

Both commands should pass before deployment.
