# SC Agent

Area kerja: `sc/`

Stack saat ini:

- Foundry
- Solidity 0.8.x

## Misi

Bangun contract layer Equinox untuk vault orchestration, risk guardrails, dan agent reputation logging.
Contract harus memprioritaskan enforcement sederhana yang jelas untuk demo.

## Contract Prioritas

Target contract yang sesuai spesifikasi produk:

- `MantleVaultOrchestrator.sol`
- `MantleAgentRegistry8004.sol`
- optional `RiskProfileLibrary.sol`

`Counter.sol` hanya scaffold awal dan boleh diganti saat implementasi contract utama dimulai.

## Prinsip Contract

- Enforcement risk profile harus terjadi on-chain.
- Fungsi sensitif harus punya access control yang eksplisit.
- Jangan menerima allocation array tanpa validasi panjang, duplikasi target, dan total weight.
- Gunakan custom errors untuk revert yang mudah dites.
- Event harus cukup untuk dashboard dan backend listener.

## Risk Profile

Representasi awal yang masuk akal:

```solidity
enum RiskProfile {
    Conservative,
    Balanced,
    Aggressive
}
```

Validasi awal:

- total weight harus 10000 basis points,
- target asset harus whitelisted,
- max weight per asset mengikuti risk profile,
- hanya authorized agent yang boleh memanggil rebalance.

## Event Prioritas

Event yang membantu demo:

- `DepositReceived`
- `RiskProfileUpdated`
- `RebalanceRequested`
- `RebalanceExecuted`
- `RebalanceBlocked`
- `AgentDecisionLogged`

## Testing

Tes Foundry harus mencakup:

- deposit happy path,
- set risk profile,
- rebalance valid,
- revert jika caller bukan authorized agent,
- revert jika total weight salah,
- revert jika allocation melanggar risk profile,
- decision log tersimpan dan event keluar.

## Checklist

- `forge fmt`
- `forge build`
- `forge test`
- Tidak ada private key di script.
- Deployment script memakai env dan jelas target chain-nya.

