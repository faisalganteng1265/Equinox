# SC Task Breakdown

## Goal

Membuat `sc/` menjadi smart contract layer Equinox yang:

- aman untuk demo dan testnet
- mudah diaudit
- siap menerima adapter nyata
- bertumbuh menuju mainnet readiness

---

## Current State

### Sudah ada

- core vault
- agent registry
- mock asset layer
- mock exchange
- mock adapters
- risk guardrails
- preview/reject/execute rebalance
- deploy script
- vault factory
- per-user vault registry lookup
- fuzz tests
- invariant suite
- gas report baseline
- deployment export artifact

### Yang masih tertinggal

- helper view yang lebih ramah FE/BE
- audit-prep documentation
- adapter interface review untuk venue nyata
- emergency/admin production controls

---

## P1: Contract Architecture and Audit Prep

## Task 1: VaultFactory and Per-User Vault Model

Status: `implemented in SC`

### Work

- `src/VaultFactory.sol` sudah ditambahkan
- flow yang sudah tersedia:
  - create vault
  - bind owner
  - bind agent identity
  - bind authorized backend agent
- registry/lookup minimal:
  - `owner -> vault`
  - `vault -> agentId`
- tambahan lookup:
  - `vault -> owner`
  - `agentId -> vault`
  - `allVaults`
- pertahankan `MantleVaultOrchestrator` sebagai core vault per user
- factory mendukung:
  - `createVault(agentURI)` untuk self-serve user
  - `createVaultFor(owner, agentURI)` untuk admin-sponsored demo/init

### Done when

- `forge test` lulus dengan test factory
- deploy script men-deploy factory dan grant registry roles yang dibutuhkan

### Notes for BE/FE

- Factory harus diberi `REGISTRAR_ROLE` dan `DEFAULT_ADMIN_ROLE` pada `MantleAgentRegistry8004` agar bisa mint agent dan grant `LOGGER_ROLE` ke vault baru.
- BE/FE berikutnya perlu mengganti model satu `VAULT_ADDRESS` global menjadi lookup dari `VaultFactory.vaultOfOwner(user)`.
- Event utama untuk indexing: `VaultCreated(owner, vault, agentId, agentWallet)`.

---

## Task 2: Frontend-Facing Read Helpers

### Work

- evaluasi helper view:
  - allocation summary
  - active strategy summary
  - latest adapter snapshot rollup
- kurangi kebutuhan multicall FE/BE jika memang masuk akal

### Done when

- FE/BE tidak perlu transform terlalu berat untuk read path umum

---

## Task 3: Adapter Interface Review

### Work

- audit `IStrategyAdapter` untuk kebutuhan Aave-like dan CeFi accounting adapter
- cek reporting hooks dan emergency semantics yang belum ada

### Done when

- interface tidak perlu dibongkar besar saat real adapter dimulai

---

## Task 4: Audit Prep Package

### Work

- contract assumptions doc
- threat model notes
- privileged role matrix
- reference untuk gas baseline dan deployment artifact

### Done when

- repo `sc/` siap di-review lebih formal

---

## P2: Mainnet and Institutional Path

## Task 5: Real Strategy Adapters

### Work

- tambah adapter produksi untuk venue nyata yang memang tersedia
- tambah fork tests
- tambah edge-case tests per protocol

### Done when

- setidaknya satu adapter nyata terbukti jalan di test/fork

---

## Task 6: Emergency and Admin Controls

### Work

- evaluasi pause granularity
- evaluasi emergency withdrawal
- evaluasi role separation untuk production

### Done when

- ada control surface yang layak untuk incident handling

---

## Task 7: External Audit Remediation Loop

### Work

- jalankan audit
- tutup temuan
- tambah regression test per finding

### Done when

- semua temuan kritis/high ditutup dengan bukti test

---

## Definition of Done for SC

SC dianggap siap ke fase berikutnya jika:

- helper read path yang dibutuhkan FE/BE sudah jelas
- adapter interface siap untuk venue nyata
- audit-prep docs tersedia
- emergency/admin hardening punya desain yang jelas
