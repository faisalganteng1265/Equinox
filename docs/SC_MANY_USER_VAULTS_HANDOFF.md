# SC Many User Vaults Handoff

## Completed

- Added `src/VaultFactory.sol`.
- Added per-user vault/account lookup:
  - `vaultOfOwner(owner)`
  - `ownerOfVault(vault)`
  - `agentOfVault(vault)`
  - `vaultOfAgent(agentId)`
  - `allVaults()`
  - `vaultCount()`
- Added user self-serve creation:
  - `createVault(agentURI)`
- Added admin-sponsored creation:
  - `createVaultFor(owner, agentURI)`
- Factory now mints a user-specific agent identity through `MantleAgentRegistry8004`.
- Factory deploys a fresh `MantleVaultOrchestrator` with:
  - owner = user
  - authorizedAgent = shared backend/operator address
  - agentId = newly minted user agent NFT
  - default risk profile and asset policies copied from factory config
- Factory grants `LOGGER_ROLE` to each new vault so `recordRejectedDecision` and `executeRebalance` can log decisions.
- Deploy script now deploys `VaultFactory` and grants the factory:
  - `DEFAULT_ADMIN_ROLE` on agent registry
  - `REGISTRAR_ROLE` on agent registry
- Added `test/VaultFactory.t.sol`.

## Validation

Ran from `sc/`:

```bash
forge fmt
forge build
forge test
```

Result:

```text
forge build: compiler run successful
forge test: 31 tests passed, 0 failed, 0 skipped
```

Note: Foundry still prints a dependency install warning because `sc/lib/forge-std` already exists while it tries to auto-install missing dependencies, but compilation and tests pass.

## Mantle Sepolia Deployment

Deployment completed on chain `5003`.

```text
Mock USDY:              0xedb3f61f6a134d9d40b0e9edc1c840c629a7cb7b
Mock mETH:              0x0ba14f2a413413f30823ed5a595d118aec5db815
Mock fBTC:              0x16dc6ca28f73bfce4bcdd33e4a151ae0efc181b3
Mock MI4:               0x6a8b5212309f3dbacbc15942f01fe7240d84eb73
Exchange:               0xafcb338937e421d30297c527f03ad00f504d2096
Strategy Registry:      0xfda90238e3bd24b7a2a22ddc90feeabe868a1d5b
Agent Registry:         0x8819817d9f5c8a9c68be641a19aaa13874e759d6
Vault Factory:          0x5910ca4717015c9d152dc5b537ff97b744b0da6f
USDY Idle Adapter:      0x13e8a22da4c64882aa3f81f5854986d77b965c52
mETH DeFi Adapter:      0xd2dfcc93af2edec6bb7d956cc96453f45aea260f
fBTC CeFi Adapter:      0x23f99d75285dafbd8c5abe5ff4e143efaff3030c
MI4 DeFi Adapter:       0xe71b5b04d5f6b77826099732471635388e5ece03
Initial Demo Vault:     0xe18cf11aee9c42d4562e3929463c83ac1ec32541
Initial Agent ID:       1
Factory User Vault:     0x0362BfD1d7595C768d19Cb2c44A634F1a0d9f0F4
Factory User Agent ID:  2
```

On-chain checks:

- `Initial Demo Vault.owner()` returns `0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701`
- `Initial Demo Vault.authorizedAgent()` returns `0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701`
- `VaultFactory.vaultCount()` returned `0` immediately after deployment and now returns `1` after the first factory-created user vault.
- `AgentRegistry.hasRole(DEFAULT_ADMIN_ROLE, VaultFactory)` returns `true`
- `AgentRegistry.hasRole(REGISTRAR_ROLE, VaultFactory)` returns `true`
- After BE/FE integration smoke test, `VaultFactory.vaultOfOwner(0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701)` returns `0x0362BfD1d7595C768d19Cb2c44A634F1a0d9f0F4`.

## Still Not Done

- No event indexer or persistence exists yet for `VaultCreated`.
- Contract verification on explorer is not automated yet.

## BE / FE Follow-up Completed

- BE now supports `VAULT_FACTORY_ADDRESS`.
- BE exposes `GET /api/accounts/:owner`.
- BE exposes admin-sponsored `POST /api/vaults/create`.
- BE portfolio/vault/rebalance paths can resolve a user vault via `owner`.
- FE now checks the connected wallet against `accounts/:owner`.
- FE shows a `Create demo portfolio` state when the connected wallet has no factory vault.
- FE sends `owner` with portfolio and rebalance requests so user-specific vaults can be used.
- Local BE env now points to the new contract deployment. The connected deployer wallet resolves to the factory-created user vault above.

## Next Suggested Work

- Add optional event indexing for `VaultCreated`.
- Add `VAULT_FACTORY_ADDRESS` to shared deployment docs/templates.
- Decide whether production should keep admin-sponsored `createVaultFor` or move FE to direct wallet `createVault`.
