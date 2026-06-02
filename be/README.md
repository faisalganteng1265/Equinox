# ⚙️ Equinox Backend Orchestrator (Yield Strategy, LLM Reasoning & Web3 Execution Broker)

[![Runtime: Node.js](https://img.shields.io/badge/Runtime-Node.js%20%2F%20TypeScript-blue.svg)](https://nodejs.org/)
[![Server: Express](https://img.shields.io/badge/Framework-Express%205-green.svg)](https://expressjs.com/)
[![Web3: Viem](https://img.shields.io/badge/Web3-Viem%202-purple.svg)](https://viem.sh/)
[![AI reasoning: OpenRouter](https://img.shields.io/badge/AI--Reasoning-OpenRouter-orange.svg)](https://openrouter.ai/)

This folder contains the **Equinox Backend Orchestrator**—the off-chain automated hub of the Equinox RWA platform. It coordinates market data ingestion (both DeFi yields on Mantle L2 and CeFi rates on Bybit CeFi Earn), evaluates deterministic yield reallocation plans, utilizes OpenRouter LLMs for natural language strategy justifications, and signs transaction calls using an operator wallet to execute vault rebalancing.

---

## 🎯 Backend Services & API Architecture

The backend application is structured around dedicated TypeScript modules managing blockchain connections, strategy, and reasoning:

### 1. 📡 Web3 Client & RPC Listening (`src/services/clients.ts`, `src/services/equinox.ts`)
*   **Purpose**: Manages connections to Mantle Sepolia testnet.
*   **Key Features**:
    *   Utilizes Viem clients configured with an operator private key to sign write actions.
    *   Reads live on-chain states from deployed vaults, ERC-8004 registries, and strategy registries.

### 2. 🧠 Strategy & Market Simulation (`src/services/strategy.ts`, `src/services/market-sim.ts`)
*   **Purpose**: Performs deterministic optimization across yield options.
*   **Key Features**:
    *   Periodically maps rate changes, computes realistic gas thresholds, and forms balanced target weights.
    *   Integrates with a simulated/real Bybit API connector to check off-chain CeFi Earn rates.

### 3. 💬 OpenRouter Reasoning Provider (`src/services/reasoning.ts`)
*   **Purpose**: Translates quantitative math into human-understandable narratives.
*   **Key Features**:
    *   Transmits yield differentials, asset names, and active risk profile limits to Gemini models via OpenRouter.
    *   Parses returned Markdown reasoning and confidence ratings to serve as the live dApp activity feed.

### 4. 🔗 REST API Endpoints (`src/app.ts`)
*   **Purpose**: Exposes standardized APIs to the Next.js frontend.
*   **Key Features**:
    *   `GET /api/contracts`: Exposes active address manifests.
    *   `GET /api/portfolio`: Aggregates NAV and adapter exposure balances.
    *   `POST /api/rebalance/preview`: Performs contract-level simulations to confirm that strategy targets do not violate on-chain risk guardrails.
    *   `POST /api/rebalance/execute`: Submits signed transactions on-chain.
    *   `POST /api/demo/mint`: Mints mock testnet tokens to vault owners.

---

## ⚙️ Environment Variables Setup

Before running the backend, create your `.env` configuration file:

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Fill in the network providers, OpenRouter API keys, and deployed contract addresses:

```env
PORT=4000
MANTLE_RPC_URL="https://rpc.sepolia.mantle.xyz"
OPERATOR_PRIVATE_KEY="0x..." # Private key of the backend executor wallet

# API Keys
WRITE_API_KEY="your_optional_secure_api_token"
OPENROUTER_API_KEY="your_openrouter_api_token"
OPENROUTER_MODEL="google/gemini-2.5-flash" # AI reasoning LLM target

# Deployed Contract Addresses on Mantle Sepolia L2
CONTRACT_MANTLE_VAULT_ORCHESTRATOR="0x5cFF4689e4c828EBbfd2e15E1a8629137219Eaf1"
CONTRACT_AGENT_REGISTRY="0x48C51D7ADB14B79bC3e01B5eCeFBE63695c99834"
CONTRACT_VAULT_FACTORY="0x49cf06766902AD1022927fac6F98B2b793D29531"
CONTRACT_STRATEGY_REGISTRY="0x57A447FC04934b45d47Bc408cca92c27D77838e3"
CONTRACT_EXCHANGE="0x17c4CE203272C62A8d029210b1eD182127Aa94FD"

# Adapter Addresses
CONTRACT_USDY_IDLE_ADAPTER="0xf0A77F62e5BD9905be20E9016d316786903223e3"
CONTRACT_METH_DEFI_ADAPTER="0x8f699c98556e30Dc17Fb2BDBEeF76D25767145c2"
CONTRACT_FBTC_CEFI_ADAPTER="0x748914EFb51e8F24b8177f4C1E6d82ec68E67e3C"
CONTRACT_MI4_DEFI_ADAPTER="0x0B39E9865B027C288872CA71A2a567E95C6FcF58"
```

---

## ⚡ Development & Scripts

To run the backend orchestrator:

### 1. From the Monorepo Root (Recommended)
```bash
# Compile and boot the Express API server
pnpm dev:be
```

### 2. From the `be/` Directory Directly
```bash
cd be

# Install local dependencies
pnpm install

# Start Express server via tsx file-watching utility
pnpm run dev
```
The server will boot and be live on [http://localhost:4000](http://localhost:4000).

### 3. Testing and Compilation
Validate routing and strategy modules using Vitest:
```bash
pnpm run test
pnpm run build
```

---

## 🛠️ Technology Stack & Web Standards

*   **Runtime Engine**: Node.js & TypeScript.
*   **Server Framework**: Express.js `5.x`.
*   **Web3 Clients**: Viem `2.x` for RPC connection pool and transaction serialization.
*   **Validation**: Zod for type-safe environment and API request verification.
*   **Test Runner**: Vitest `4.x` and Supertest for API integration testing.

---

## 📄 License
Licensed under the **MIT License**.
