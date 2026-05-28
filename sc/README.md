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

Penting: `MantleVaultOrchestrator` tetap single-owner per instance. Untuk banyak user, repo sekarang menyediakan `VaultFactory` yang membuat satu vault baru dan satu agent identity baru per user.

## Arah Arsitektur Berikutnya

Narasi produk Equinox yang ingin dituju berikutnya adalah:

- `1 user = 1 vault`
- `1 vault = 1 personal agent identity`
- `shared backend strategy engine`
- `shared OpenRouter reasoning layer`

Untuk mencapai itu, smart contract sekarang menyediakan `VaultFactory` yang:

- membuat vault baru per user
- bind `owner -> vault`
- bind `vault -> agentId`
- tetap menunjuk backend operator sebagai `authorizedAgent`

Dengan model ini, setiap user memiliki custody, history, dan AI agent identity miliknya sendiri, sementara backend tetap menghitung strategi secara terpusat `per vault`.

## Kontrak Inti

- `src/MantleAgentRegistry8004.sol`
  Registry identitas agen berbasis `ERC721` untuk mint agent NFT, simpan `agentWallet`, metadata tambahan, dan log keputusan/performance on-chain.

- `src/MantleVaultOrchestrator.sol`
  Core vault per user yang mengelola custody aset, enforce risk profile, preview rebalance, record rejected decision, execute rebalance lintas aset, dan deploy dana ke strategy adapter.

- `src/VaultFactory.sol`
  Factory untuk membuat vault baru per user, mint agent identity milik user tersebut, dan grant logger role ke vault baru.

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
  MantleVaultOrchestratorFuzz.t.sol
  MantleVaultOrchestratorInvariant.t.sol
  StrategyInfrastructure.t.sol

script/
  DeployEquinoxCore.s.sol
```

## Command

Jalankan dari folder `sc`:

```bash
forge build
forge test
forge test --gas-report
forge fmt
```

## Deploy Script Saat Ini

Script deploy contoh:

```bash
script/DeployEquinoxCore.s.sol
```

Isi `.env` berdasarkan `.env.example`, lalu jalankan:

```bash
forge script script/DeployEquinoxCore.s.sol:DeployEquinoxCore --rpc-url <MANTLE_TESTNET_RPC_URL> --broadcast --via-ir --slow --gas-estimate-multiplier 200 --disable-block-gas-limit -vvvv
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

## Command Foundry yang Disarankan

Jalankan dari folder `sc`:

```bash
forge build
forge test
forge test --gas-report
forge fmt
```

Untuk export address dari hasil deploy lokal/testnet:

```bash
node scripts/export-latest-deployment.mjs <CHAIN_ID>
```

Contoh Mantle Sepolia:

```bash
node scripts/export-latest-deployment.mjs 5003
```

Catatan:

- `export-latest-deployment.mjs` hanya helper lokal untuk handoff address ke FE/BE
- `deployments/` aman untuk tetap di-ignore bila tidak ingin dibawa ke GitHub
- selama Anda hanya mengubah test atau docs, tidak perlu redeploy contract

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
- invariant suite untuk konsistensi target weights dan policy
- fuzz suite untuk preview/withdraw/rejected decision edge cases
