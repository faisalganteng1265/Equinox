# 💻 Equinox Frontend (Web3 Portfolio Dashboard & Agent Command Center)

[![Framework: Next.js 16](https://img.shields.io/badge/Framework-Next.js%2016-black.svg)](https://nextjs.org/)
[![React: 19](https://img.shields.io/badge/Library-React%2019-blue.svg)](https://react.dev/)
[![Styling: TailwindCSS 4](https://img.shields.io/badge/Styling-TailwindCSS%204-cyan.svg)](https://tailwindcss.com/)
[![Web3: RainbowKit / Wagmi](https://img.shields.io/badge/Web3-RainbowKit%20%2F%20Wagmi-purple.svg)](https://www.rainbowkit.com/)

This folder contains the **Equinox Frontend Web Portal**—the user dashboard layer of the Equinox RWA platform. It connects to users' wallets via RainbowKit, provides asset deposit and withdrawal controls directly on Mantle Sepolia, visualizes NAV breakdowns and portfolio strategies, and displays the real-time decision reasoning logged by AI agents.

---

## 🎯 Application Hubs & UX Views

The frontend portal provides a premium, high-contrast dark theme (powered by Tailwind 4 CSS tokens) divided into several functional views:

### 1. 📊 Portfolio Command Dashboard (`/`)
*   **Purpose**: Central dashboard where users manage deposits, withdrawals, and monitor rebalancing.
*   **Key Features**:
    *   **Live NAV Card**: Renders real-time net asset values dynamically parsed from backend API services.
    *   **Donut & Allocation Charts**: Visualizes exposures across USDY, mETH, fBTC, and MI4 using custom chart wrappers.
    *   **Capital Topology Diagram**: Renders connection maps linking assets to their active yield-accruing adapters.
    *   **Quick Deposit/Withdraw Modals**: Integrated Web3 forms enabling direct interaction with the Mantle L2 vaults.

### 2. 🤖 Agent Registry View (`/agents`)
*   **Purpose**: Details the autonomous agent registered to the vault under standard ERC-8004.
*   **Key Features**:
    *   Shows the Agent NFT ID, assigned wallet address, historical performance metrics, win-rate, and on-chain reputation score.

### 3. 📝 Decision & Strategy Feeds (`/history`, `/strategy`)
*   **Purpose**: Offers clear visibility into adapter setups and AI agent decision streams.
*   **Key Features**:
    *   Lists approved adapters (MockIdle, MockDeFiLending, MockCeFiEarn) and their active APYs, risk ratings, and liquidity statuses.
    *   Presents a stream of rebalance plans marked as `Executed` or `Blocked` (when risk caps are violated).

### 4. 🛠️ Floating Demo Panel (Tweaks Bar)
*   **Purpose**: Simulates state variations for evaluation and hackathon presentations.
*   **Key Features**:
    *   Toggle themes, change accent colors, alter agent persona tone, and switch risk profiles (Conservative, Balanced, Aggressive).

---

## ⚙️ Environment Variables Setup

Before running the frontend application, copy the example environment configuration:

1. Create a `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
2. Configure the required parameters:

```env
# 1. WalletConnect Project ID for RainbowKit Web3 pairing
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_walletconnect_project_id"

# 2. Origin URL of the Equinox Backend Orchestrator API
EQUINOX_API_ORIGIN="http://localhost:4000"

# 3. Optional write API key if the backend requires authentication
EQUINOX_WRITE_API_KEY="your_backend_write_api_key"
```

---

## ⚡ Development & Scripts

To start the frontend application locally:

### 1. From the Monorepo Root (Recommended)
You can run workspace commands directly from the project root:
```bash
# Starts both Express backend and Next.js dev server concurrently
pnpm dev
```
To run only the frontend dev script:
```bash
pnpm dev:fe
```

### 2. From the `fe/` Directory Directly
If executing scripts directly within this workspace:
```bash
cd fe

# Install workspace dependencies
pnpm install

# Start Next.js development server
pnpm run dev
```
The client portal will be available at [http://localhost:3000](http://localhost:3000).

### 3. Build & Lint Verification
Ensure the build and lints pass before opening pull requests:
```bash
pnpm run build
pnpm run lint
```

---

## 📂 Project Structure

*   `src/app/` - App Router page shell and routing.
    *   `globals.css` - Global theme variables, utility classes, and custom styling overrides.
    *   `providers.tsx` - Root Web3 context (RainbowKit, Wagmi, React Query).
    *   `page.tsx` - Primary landing and dashboard application layout.
    *   `api/` - Next.js endpoints proxying requests to the Express backend and fetching Mantle SDK gas metrics.
*   `src/components/` - Interactive UI components.
    *   `charts.tsx` - Allocation charts, donut graphs, and sparklines.
    *   `modals.tsx` - Action overlays for deposit, withdraw, and risk alerts.
    *   `tweaks-panel.tsx` - Dynamic demo configuration switches.
    *   `v2-topology.tsx` - Visual representation of asset-to-venue topology.
*   `src/lib/` - Libraries and helpers.
    *   `abis.ts` - Smart contract ABIs for client-side transaction compilation.
    *   `equinox-api.ts` - Local API client querying backend endpoints.

---

## 🛠️ Technology Stack & Web Standards

*   **Framework**: Next.js `16.x` using the App Router.
*   **Web3 Engine**: Wagmi `2.x`, RainbowKit `2.x`, and Viem `2.x` for secure EVM account connectivity.
*   **Gas Estimator**: `@mantleio/sdk` `1.x` for Mantle L2 gas overhead assessments.
*   **Styling**: TailwindCSS `4.x` with CSS design system tokens.
*   **Animations**: GSAP for premium page loading transitions and hover feedback.

---

## 📄 License
Licensed under the **MIT License**.
