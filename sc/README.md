# Equinox Smart Contracts

The Equinox smart contract layer is built with `Foundry` and locked to `solc 0.8.23`, matching the safe compatibility target for `Mantle`.

This README is intended for:
- engineering handoff
- deployment and verification operations
- backend and frontend integration
- early audit and architecture review

## Purpose

The `sc` package is the on-chain layer for:
- user vault custody
- rebalance risk guardrails
- on-chain agent identity and decision logging
- the orchestration shell for mock assets and mock venues on `Mantle Sepolia`

The current version intentionally uses:
- `mock assets`
- `mock venue adapters`
- `real on-chain state transitions`
- `real role enforcement`
- `real decision logging`

This allows the full Equinox flow to be demonstrated on testnet without depending on live protocols such as `Aave` or `CIAN`.

## Implementation State

The `sc` package is currently:
- deployable
- verified on `Mantle Sepolia`
- test-covered
- ready to integrate with `be` and `fe`

This should be read as:
- production-grade as an engineering package
- not yet production-ready for real funds

The distinction matters:
- the contracts are structured, documented, testable, and reproducibly verifiable
- but venue dependencies, pricing, monitoring, and operational controls are still mock and testnet-oriented

## Current Product Model

The smart contract architecture now follows:

- `1 user = 1 vault`
- `1 vault = 1 personal agent identity`
- `1 shared backend operator = many vaults`

This means:
- each user owns an independent vault
- each vault is bound to its own `agentId`
- backend and AI orchestration may be shared, but execution and history remain isolated per vault

This is aligned with the Equinox product direction:
- personal vaults
- personal agent identities
- a shared strategy engine
- a shared reasoning layer

Implementation note:
- the deploy script still creates `1 initial demo vault` for bootstrap and compatibility testing
- the recommended product path is still `VaultFactory`
- the bootstrap vault is not the final onboarding model, only the first seeded deployment

## Current Non-Goals

The following are intentionally out of scope for the current `sc` layer:
- live mainnet protocol integrations
- pooled multi-user vaults with `ERC4626`
- production-grade price oracles
- governance or DAO control
- persistent on-chain event indexing

## Core Contracts

| Contract | File | Responsibility |
| --- | --- | --- |
| `MantleAgentRegistry8004` | `src/MantleAgentRegistry8004.sol` | Agent identity registry, decision logging, and basic reputation stats |
| `MantleVaultOrchestrator` | `src/MantleVaultOrchestrator.sol` | Single-owner vault, custody, preview/execute/reject rebalance flow |
| `VaultFactory` | `src/VaultFactory.sol` | Creates one vault and one agent identity per user |
| `StrategyRegistry` | `src/StrategyRegistry.sol` | Approved adapter registry per asset |
| `MockAssetExchange` | `src/MockAssetExchange.sol` | Mock pricing and asset swaps across mock tokens |
| `MockAssetToken` | `src/mocks/MockAssetToken.sol` | Mock ERC20 assets for `USDY`, `mETH`, `fBTC`, and `MI4` |
| `Mock*Adapter` | `src/adapters/*` | Simulated venues with yield accrual and market snapshots |

### 1. `MantleAgentRegistry8004`

File:
- `src/MantleAgentRegistry8004.sol`

Responsibilities:
- mint `ERC721` agent identities
- store `agentWallet`
- store decision history
- maintain basic performance and reputation statistics

Important roles:
- `DEFAULT_ADMIN_ROLE`
- `REGISTRAR_ROLE`
- `LOGGER_ROLE`

### 2. `MantleVaultOrchestrator`

File:
- `src/MantleVaultOrchestrator.sol`

Responsibilities:
- custody assets for a single owner
- deposit and withdraw supported assets
- enforce `RiskProfile`
- `previewRebalance`
- `recordRejectedDecision`
- `executeRebalance`
- pull liquidity back from adapters when needed for withdrawals

Important note:
- a vault instance remains `single-owner`
- many-user support is achieved through `VaultFactory`, not through one shared global vault

### 3. `VaultFactory`

File:
- `src/VaultFactory.sol`

Responsibilities:
- create one vault per user
- mint one new agent identity per user
- maintain:
  - `vaultOfOwner(owner)`
  - `ownerOfVault(vault)`
  - `agentOfVault(vault)`
  - `vaultOfAgent(agentId)`
- expose `allVaults()` for backend iteration

The factory also grants `LOGGER_ROLE` to each new vault so it can write decisions into the registry.

### 4. `StrategyRegistry`

File:
- `src/StrategyRegistry.sol`

Responsibilities:
- approve adapters per asset
- expose the approved adapter list for each supported asset

### 5. `MockAssetExchange`

File:
- `src/MockAssetExchange.sol`

Responsibilities:
- store mock prices per asset
- provide swap quotes
- swap exact input across mock assets

### 6. `MockAssetToken`

File:
- `src/mocks/MockAssetToken.sol`

Responsibilities:
- mock ERC20 implementations for:
  - `Mock USDY`
  - `Mock mETH`
  - `Mock fBTC`
  - `Mock MI4`

### 7. Strategy Adapters

Folder:
- `src/adapters/`

Current adapters:
- `MockIdleAdapter`
- `MockDeFiLendingAdapter`
- `MockCeFiEarnAdapter`

Responsibilities:
- accept assets from vaults
- maintain internal share accounting
- accrue simulated yield over time
- expose `latestSnapshot`

### 8. Shared Types and Errors

Files:
- `src/common/Types.sol`
- `src/common/Errors.sol`

Contains:
- `RiskProfile`
- `VenueType`
- `RebalanceRejectionReason`
- `StrategyTarget`
- `MarketSnapshot`
- `PreviewResult`
- shared custom errors

## Guardrails and Risk Model

The vault currently enforces:
- only supported assets may be used
- only approved adapters may be used for a given asset
- targets may not be duplicated
- total target weight must equal `10_000 bps`
- asset target weights must respect the active risk profile caps
- adapter risk scores may not exceed the tolerated limits
- assets must have prices configured in the mock exchange

Available risk profiles:
- `Conservative`
- `Balanced`
- `Aggressive`

## Runtime Flow

Recommended operational flow:

1. deploy the full core stack
2. create a user vault through `VaultFactory`
3. mint or faucet mock assets to the vault owner
4. the owner deposits into the vault
5. the backend calls `previewRebalance`
6. if guardrails pass, the backend calls `executeRebalance`
7. if guardrails fail, the backend calls `recordRejectedDecision`
8. the frontend reads vault state, adapter exposure, and decision history

Operationally:
- the user wallet controls deposit and withdrawal for its own vault
- the backend operator controls snapshot updates, preview, execute, and reject flows
- the contracts act as the final enforcement layer for permissions and risk bounds

## Folder Structure

```text
sc/
  src/
    adapters/
    common/
    interfaces/
    mocks/
    MantleAgentRegistry8004.sol
    MantleVaultOrchestrator.sol
    MockAssetExchange.sol
    StrategyRegistry.sol
    VaultFactory.sol

  script/
    DeployEquinoxCore.s.sol

  test/
    utils/
    MantleAgentRegistry8004.t.sol
    MantleVaultOrchestrator.t.sol
    MantleVaultOrchestratorFuzz.t.sol
    MantleVaultOrchestratorInvariant.t.sol
    StrategyInfrastructure.t.sol
    VaultFactory.t.sol

  foundry.toml
  remappings.txt
  .env.example
```

## Requirements

- `Foundry`
- `solc 0.8.23`
- dependency libraries:
  - `forge-std`
  - `openzeppelin-contracts`

## Compiler Configuration

File:
- `foundry.toml`

Current key settings:
- `solc_version = "0.8.23"`
- `optimizer = true`
- `optimizer_runs = 200`

When deploying the Equinox script, also use:
- `--via-ir`

This is important to keep the deploy and verify compile path consistent.

## Environment

Template:
- `.env.example`

Required variables:

```env
DEPLOYER_PRIVATE_KEY=0x<YOUR_PRIVATE_KEY>
VAULT_OWNER=0x<VAULT_OWNER_ADDRESS>
AUTHORIZED_AGENT=0x<BACKEND_AGENT_ADDRESS>
AGENT_WALLET=0x<AGENT_IDENTITY_WALLET_ADDRESS>
```

Optional bootstrap variables:
- `INITIAL_VAULT_OWNER_MINT`
- `USDY_PRICE_E18`
- `METH_PRICE_E18`
- `FBTC_PRICE_E18`
- `MI4_PRICE_E18`
- adapter APY, risk, and liquidity snapshot values

Hackathon note:
- all addresses above may use the same wallet
- this is practical for demos
- it is not suitable for production

Operational note:
- the `.env` inside `sc` is only used for deployment and bootstrap
- `be` and `fe` do not read this file at runtime
- after a redeploy, the backend env and config are the pieces that must be updated

## Build and Test

Run from the `sc` directory:

```bash
forge build
forge fmt
forge test
forge test --gas-report
```

The current test suite covers:
- registry unit tests
- vault unit tests
- strategy infrastructure tests
- fuzz tests
- invariant tests
- vault factory tests

Latest status:
- `31 tests passed`
- `0 failed`

Minimum recommended gate before any new deployment:
- `forge fmt`
- `forge test`
- `forge test --gas-report`

## Deploy

Deployment script:
- `script/DeployEquinoxCore.s.sol`

Example flow:

```bash
copy .env.example .env
```

Then fill `.env`, and deploy:

```bash
forge script script/DeployEquinoxCore.s.sol:DeployEquinoxCore --rpc-url https://rpc.sepolia.mantle.xyz --broadcast --via-ir --slow --gas-estimate-multiplier 200 --disable-block-gas-limit -vvvv
```

The deployment script will:
- deploy 4 mock assets
- deploy the exchange
- deploy the strategy registry
- deploy the agent registry
- deploy 4 adapters
- deploy 1 initial demo vault
- deploy 1 vault factory
- seed mock prices
- seed adapter snapshots
- mint initial `Mock USDY` to `VAULT_OWNER`

The script also bootstraps roles:
- `OPERATOR_ROLE` to `AUTHORIZED_AGENT` on the exchange and adapters
- `LOGGER_ROLE` to the initial vault on the registry
- `DEFAULT_ADMIN_ROLE` and `REGISTRAR_ROLE` to the factory on the registry

Deployment output:
- 4 mock assets
- 4 mock adapters
- 1 exchange
- 1 strategy registry
- 1 agent registry
- 1 initial demo vault
- 1 vault factory

After deployment:
- the backend can be pointed directly to the new addresses
- the frontend continues to read addresses through the backend
- verification can be executed without changing source, as long as the compile context is unchanged

## Verify

Root helper:
- `../verify-equinox-sc.bat`

This batch script is set up to:
- verify the latest deployed contracts
- encode constructor arguments automatically
- run `forge verify-contract` one contract at a time

To run from the repository root:

```bat
verify-equinox-sc.bat
```

If you need to verify manually from inside `sc`, the general pattern is:

```bash
forge verify-contract <ADDRESS> <PATH:CONTRACT> --chain 5003 --verifier etherscan --etherscan-api-key <MANTLESCAN_API_KEY> --compiler-version v0.8.23+commit.f704f362 --num-of-optimizations 200 --via-ir --watch --constructor-args <ENCODED_ARGS>
```

## Latest Mantle Sepolia Deployment

Chain:
- `5003`

Status:
- deployed
- verified

Addresses:

```text
Mock USDY:              0x9e7aF1A46613f04450012E822Bc8b674C33aa5D8
Mock mETH:              0xB4967c57550152026578bbBC998c47ca3fe9B69B
Mock fBTC:              0xa65074FDc9aD5c3889D9f75Eb87F9Bf6D21bda09
Mock MI4:               0x8Ec27fcf7f6396D3c35902c5d144D40E66729F85
Exchange:               0x17c4CE203272C62A8d029210b1eD182127Aa94FD
Strategy Registry:      0x57A447FC04934b45d47Bc408cca92c27D77838e3
Agent Registry:         0x48C51D7ADB14B79bC3e01B5eCeFBE63695c99834
Vault Factory:          0x49cf06766902AD1022927fac6F98B2b793D29531
USDY Idle Adapter:      0xf0A77F62e5BD9905be20E9016d316786903223e3
mETH DeFi Adapter:      0x8f699c98556e30Dc17Fb2BDBEeF76D25767145c2
fBTC CeFi Adapter:      0x748914EFb51e8F24b8177f4C1E6d82ec68E67e3C
MI4 DeFi Adapter:       0x0B39E9865B027C288872CA71A2a567E95C6FcF58
Initial Vault:          0x5cFF4689e4c828EBbfd2e15E1a8629137219Eaf1
Initial Agent ID:       1
```

MantleScan links:
- Mock USDY: `https://sepolia.mantlescan.xyz/address/0x9e7af1a46613f04450012e822bc8b674c33aa5d8`
- Mock mETH: `https://sepolia.mantlescan.xyz/address/0xb4967c57550152026578bbbc998c47ca3fe9b69b`
- Mock fBTC: `https://sepolia.mantlescan.xyz/address/0xa65074fdc9ad5c3889d9f75eb87f9bf6d21bda09`
- Mock MI4: `https://sepolia.mantlescan.xyz/address/0x8ec27fcf7f6396d3c35902c5d144d40e66729f85`
- Exchange: `https://sepolia.mantlescan.xyz/address/0x17c4ce203272c62a8d029210b1ed182127aa94fd`
- Strategy Registry: `https://sepolia.mantlescan.xyz/address/0x57a447fc04934b45d47bc408cca92c27d77838e3`
- Agent Registry: `https://sepolia.mantlescan.xyz/address/0x48c51d7adb14b79bc3e01b5ecefbe63695c99834`
- Vault Factory: `https://sepolia.mantlescan.xyz/address/0x49cf06766902ad1022927fac6f98b2b793d29531`
- USDY Idle Adapter: `https://sepolia.mantlescan.xyz/address/0xf0a77f62e5bd9905be20e9016d316786903223e3`
- mETH DeFi Adapter: `https://sepolia.mantlescan.xyz/address/0x8f699c98556e30dc17fb2bdbeef76d25767145c2`
- fBTC CeFi Adapter: `https://sepolia.mantlescan.xyz/address/0x748914efb51e8f24b8177f4c1e6d82ec68e67e3c`
- MI4 DeFi Adapter: `https://sepolia.mantlescan.xyz/address/0x0b39e9865b027c288872ca71a2a567e95c6fcf58`
- Initial Vault: `https://sepolia.mantlescan.xyz/address/0x5cff4689e4c828ebbfd2e15e1a8629137219eaf1`

## Backend / Frontend Contract Surface

The backend typically needs:
- `VaultFactory`
- `MantleVaultOrchestrator`
- `MantleAgentRegistry8004`
- `StrategyRegistry`
- `MockAssetExchange`
- adapter contracts

The frontend typically needs:
- `VaultFactory` for vault creation and discovery
- `MantleVaultOrchestrator` for approve, deposit, and withdraw flows
- `MockAssetToken` for balances and allowances

Important note:
- `be` and `fe` already use their own local ABI definitions
- neither package imports artifacts from `sc/out`
- redeploying contracts does not force cross-package Foundry artifact coupling

## Security and Operational Notes

- never pass production private keys directly on the command line
- use `.env`, keystore, or a separate signer strategy
- the current setup is still appropriate for:
  - hackathons
  - testnet demos
  - internal prototypes
- the current setup is not ready for real-fund production use

Still missing:
- live mainnet protocol integration
- monitoring and alerting
- persistent event indexing
- admin multisig flows
- production-grade oracle and pricing design
- formal audit

## Known Caveats

- explorer verification requires the exact same compile context; deploy and verify should be done from the same repo state
- `MockAssetToken`, `MockAssetExchange`, and the adapters are simulated venues only
- backend AI and reasoning do not live in the `sc` layer; the contracts are only the enforcement and logging layer
- the `initial demo vault` is not the final onboarding path; the final onboarding path is `VaultFactory`

## Recommended Next Steps

For the next evolution of the package, the best priorities are:
- event indexing for `VaultCreated`
- better deployment export artifacts
- signer hygiene and secret rotation
- production config separation
- live protocol adapters when moving from testnet mocks to real integrations
