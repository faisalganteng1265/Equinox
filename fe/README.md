# Equinox Frontend

Frontend Next.js untuk Equinox, dashboard AI-native RWA portfolio management di atas Mantle. Aplikasi ini menampilkan portfolio topology, agent reasoning stream, risk profile controls, modal wallet/deposit/shield, dan panel tweaks untuk demo visual.

## Tech Stack

- Next.js 16 dengan App Router
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint 9 dengan konfigurasi Next.js

## Getting Started

Install dependencies dari root workspace:

```bash
pnpm install
```

Jalankan frontend dari root:

```bash
pnpm dev:fe
```

Atau dari package frontend langsung:

```bash
pnpm --filter @equinox/fe dev
```

Buka `http://localhost:3000` di browser.

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
  layout.tsx        Root metadata, fonts, and HTML shell
  page.tsx          Main Equinox dashboard app shell

src/components/
  agents-page.tsx   Agent registry, strategy, and history views
  charts.tsx        Donut, area, sparkline, and allocation charts
  icons.tsx         Local icon renderer used by dashboard controls
  modals.tsx        Wallet connect, deposit, and risk shield modals
  tweaks-panel.tsx  Floating demo controls for theme/accent/profile
  v2-hero.tsx       Top navigation and memo hero
  v2-pieces.tsx     Portfolio cards, risk dial, ticker, and feed stream
  v2-topology.tsx   Capital topology visualization

src/lib/
  data.ts           Mock assets, agents, venues, risk profiles, and feed data
```

## Current UX

- Portfolio page with NAV summary, latest rebalance memo, capital topology, position cards, agent reasoning feed, risk profile dial, and decision ticker.
- Agent page for ERC-8004-style identity and agent metadata.
- Strategy page for venue and risk allocation overview.
- History page backed by the live feed entries.
- Floating tweaks panel for dark/light theme, accent color, agent tone, and risk profile.

## Validation

Run these before opening a PR or pushing larger changes:

```bash
pnpm --filter @equinox/fe lint
pnpm --filter @equinox/fe build
```

Both commands should pass before deployment.
