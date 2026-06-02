# 📜 Equinox Smart Contracts (Custody Vault, Risk Profiles & ERC-8004 Agent Registry)

[![Contracts: Solidity 0.8.23](https://img.shields.io/badge/Contracts-Solidity%200.8.23-blue.svg)](https://soliditylang.org/)
[![Framework: Foundry](https://img.shields.io/badge/Framework-Foundry-red.svg)](https://book.getfoundry.sh/)
[![Network: Mantle Sepolia](https://img.shields.io/badge/Network-Mantle%20Sepolia-purple.svg)](https://sepolia.mantlescan.xyz/)
[![Standard: ERC-8004](https://img.shields.io/badge/Standard-ERC--8004-orange.svg)](https://github.com/ethereum/ERCs/issues/8004)

This folder contains the **Equinox Smart Contract Layer**—the core Web3 security, asset custody, and agent registry base. Built with Foundry and locked to Solidity `0.8.23` for safe Mantle Network compatibility, it governs vault permissions, validates strategy weights against user-selected Risk Profiles on-chain, and logs AI agent decisions.

---

## 🎯 Contract Architecture & Modules

The contract architecture enforces security parameters and provides standard identity hooks. Key contracts are structured as follows:

### 1. 🏭 Vault Creation & Identity Onboarding (`VaultFactory.sol`)
*   **Purpose**: Manages multi-user vault provisioning.
*   **Key Features**:
    *   Implements `1 user = 1 vault` and `1 vault = 1 agent NFT` topology.
    *   Deploys new `MantleVaultOrchestrator` instances for callers and registers unique AI Agent identities.
    *   Exposes global discovery methods like `allVaults()` and links owners, vaults, and agent IDs.

### 2. 🗃️ Asset Custody & Risk Guardrails (`MantleVaultOrchestrator.sol`)
*   **Purpose**: Stores user tokens and enforces allocation parameters during rebalancing.
*   **Key Features**:
    *   Custodies mETH, USDY, fBTC, and MI4.
    *   Enforces risk-tolerance weights based on user profiles: **Conservative**, **Balanced**, and **Aggressive**.
    *   Restricts rebalancing triggers to authorized off-chain backend operators.
    *   Provides two-step rebalancing: `previewRebalance` (checks profile compliance) and `executeRebalance` (moves assets).

### 3. 🤖 Verifiable Agent Registry (`MantleAgentRegistry8004.sol`)
*   **Purpose**: ERC-8004 compliant on-chain registry mapping agents to performance logs.
*   **Key Features**:
    *   Mints unique agent ERC-721 token identities.
    *   Logs reasoning hashes (`ipfs://...` or transaction arguments) via `logDecision`.
    *   Exposes read methods for historical win-rates, total operations, and reputation indexes.

### 4. 📈 Adapters & Mock Venues (`src/adapters/`, `MockAssetExchange.sol`)
*   **Purpose**: Simulates yield accrual and swap routes.
*   **Key Features**:
    *   Adapters for USDY Idle, mETH DeFi Lending, fBTC CeFi Earn, and MI4 DeFi.
    *   `MockAssetExchange` seeds and alters prices to simulate real-world yield fluctuations and arbitrage opportunities.

---

## ⚙️ Environment Variables Setup

Configure the deployment environment variables before executing Forge scripts:

1. Copy the environment example to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in the keys and deployment parameters:

```env
DEPLOYER_PRIVATE_KEY="0x..." # Account executing deployment
VAULT_OWNER="0x..."          # Address receiving mock seed assets
AUTHORIZED_AGENT="0x..."     # Operator backend address allowed to run rebalancing
AGENT_WALLET="0x..."         # Address bound to the ERC-8004 AI identity

# Optional seeding values
INITIAL_VAULT_OWNER_MINT=100000000000000000000000 # 100,000 mUSDY
USDY_PRICE_E18=1000000000000000000
METH_PRICE_E18=2500000000000000000000
```

---

## ⚡ Development & Scripts

All contract scripts must be executed from the `sc/` directory:

### 1. Build & Compile
Compile the Solidity source files using optimized configurations:
```bash
forge build --via-ir
```

### 2. Testing Suite
Run unit, fuzz, and invariant verification testing suites:
```bash
# Run all tests
forge test

# Run tests with detailed console logs
forge test -vvv

# Inspect gas usages
forge test --gas-report
```

### 3. Deploying to Mantle Sepolia
To broadcast deployment transactions on-chain:
```bash
forge script script/DeployEquinoxCore.s.sol:DeployEquinoxCore \
  --rpc-url https://rpc.sepolia.mantle.xyz \
  --broadcast \
  --via-ir \
  --slow \
  --gas-estimate-multiplier 200 \
  --disable-block-gas-limit \
  -vvvv
```

---

## 🛠️ Technology Stack & Web Standards

*   **Compiler Version**: Solidity `0.8.23` with optimizer enabled (runs: 200).
*   **Compilation Pipelines**: `via-ir` enabled for optimized deployment bytecode sizing.
*   **Core Standards**: ERC-721 (Agent Registry NFT), ERC-20 (Mock Assets), ERC-8004 (Agent Reputation & Logging standard).
*   **Libraries**: OpenZeppelin Contracts v5 (AccessControl, SafeERC20, ERC721).
*   **Testing Toolchain**: Foundry `forge-std` test harnesses.

---

## 📄 License
Licensed under the **MIT License**.
