# Equinox Smart Contracts

Layer smart contract Equinox dibangun dengan Foundry dan dikunci pada `solc 0.8.23`, sesuai batas kompatibilitas yang Anda minta untuk Mantle.

## Arsitektur Saat Ini

Versi ini mengikuti pendekatan:

- `asset mock`
- `strategy execution mock`
- `risk guardrails real`
- `fund movement real` di dalam ekosistem mock Equinox
- `decision logging real` on-chain

Artinya seluruh flow bisa jalan penuh di `Mantle testnet` tanpa bergantung ke Aave, CIAN, atau venue live lain.

## Kontrak Inti

- `src/MantleAgentRegistry8004.sol`
  Registry identitas agen berbasis `ERC721` untuk mint agent NFT, simpan `agentWallet`, metadata tambahan, dan log keputusan/performance on-chain.

- `src/MantleVaultOrchestrator.sol`
  Vault single-user yang mengelola custody aset, enforce risk profile, preview rebalance, record rejected decision, execute rebalance lintas aset, dan deploy dana ke strategy adapter.

- `src/StrategyRegistry.sol`
  Registry adapter yang di-approve per asset.

- `src/MockAssetExchange.sol`
  Mock exchange/router untuk swap lintas mock asset berdasarkan harga operator-set.

- `src/mocks/MockAssetToken.sol`
  Mock ERC20 untuk `USDY`, `mETH`, `fBTC`, dan `MI4`.

- `src/adapters/`
  Adapter simulasi venue:
  - `MockIdleAdapter`
  - `MockDeFiLendingAdapter`
  - `MockCeFiEarnAdapter`

- `src/common/Types.sol`
  Shared enum/struct seperti `RiskProfile`, `StrategyTarget`, `PreviewResult`, `MarketSnapshot`, dan statistik agen.

- `src/common/Errors.sol`
  Shared custom errors untuk validasi dan revert path.

## Fitur On-Chain yang Sudah Jadi

- Registry agen dengan role `REGISTRAR_ROLE` dan `LOGGER_ROLE`
- Mock token layer penuh untuk aset demo
- Mock venue adapter dengan custody token sungguhan
- Yield accrual simulatif berbasis waktu dan `APY` snapshot
- Market snapshot update oleh `OPERATOR_ROLE`
- Mock exchange untuk cross-asset rebalance
- Vault rebalance dengan:
  - `previewRebalance()`
  - `recordRejectedDecision()`
  - `executeRebalance()`
- Risk guardrails berbasis:
  - max asset allocation per profile
  - max adapter risk score per profile
- Pull-back withdraw dari adapter ke vault saat idle balance kurang

## Struktur

```text
src/
  adapters/
  common/
  interfaces/
  mocks/
  MantleAgentRegistry8004.sol
  MantleVaultOrchestrator.sol
  MockAssetExchange.sol
  StrategyRegistry.sol

test/
  MantleAgentRegistry8004.t.sol
  MantleVaultOrchestrator.t.sol
  StrategyInfrastructure.t.sol

script/
  DeployEquinoxCore.s.sol
```

## Command

Jalankan dari folder `sc`:

```bash
forge build
forge test
forge fmt
```

## Deploy Script

Script deploy contoh:

```bash
script/DeployEquinoxCore.s.sol
```

Isi `.env` berdasarkan `.env.example`, lalu jalankan:

```bash
forge script script/DeployEquinoxCore.s.sol:DeployEquinoxCore --rpc-url <MANTLE_TESTNET_RPC_URL> --broadcast
```

Deploy script saat ini akan membuat:

- 4 mock asset tokens
- 1 exchange mock
- 1 strategy registry
- 1 agent registry
- 4 adapter instances contoh
- 1 vault Equinox

Deploy script juga langsung melakukan bootstrap:

- grant `OPERATOR_ROLE` ke `AUTHORIZED_AGENT` untuk exchange dan semua adapter
- grant `LOGGER_ROLE` ke vault pada agent registry
- set harga awal semua mock asset
- set snapshot awal semua adapter
- mint saldo awal `Mock USDY` ke `VAULT_OWNER`

## Validasi yang Sudah Dilakukan

- `forge fmt`
- `forge test`

Suite test saat ini mencakup:

- mint dan update agent registry
- authorization logging
- swap mock exchange
- yield accrual adapter
- deposit vault
- preview rebalance yang ditolak guardrail
- record rejected decision
- execute rebalance lintas asset + lintas strategy
- withdraw yang menarik dana kembali dari adapter
