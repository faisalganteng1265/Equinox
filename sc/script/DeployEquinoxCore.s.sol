// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {console2} from "forge-std/console2.sol";
import {Script} from "forge-std/Script.sol";

import {MantleAgentRegistry8004} from "../src/MantleAgentRegistry8004.sol";
import {MantleVaultOrchestrator} from "../src/MantleVaultOrchestrator.sol";
import {MockAssetExchange} from "../src/MockAssetExchange.sol";
import {StrategyRegistry} from "../src/StrategyRegistry.sol";
import {VaultFactory} from "../src/VaultFactory.sol";
import {MockCeFiEarnAdapter} from "../src/adapters/MockCeFiEarnAdapter.sol";
import {MockDeFiLendingAdapter} from "../src/adapters/MockDeFiLendingAdapter.sol";
import {MockIdleAdapter} from "../src/adapters/MockIdleAdapter.sol";
import {RiskProfile} from "../src/common/Types.sol";
import {MockAssetToken} from "../src/mocks/MockAssetToken.sol";

contract DeployEquinoxCore is Script {
    struct CoreContracts {
        MockAssetToken usdy;
        MockAssetToken mEth;
        MockAssetToken fBtc;
        MockAssetToken mi4;
        MockAssetExchange exchange;
        StrategyRegistry strategyRegistry;
        MantleAgentRegistry8004 registry;
        MockIdleAdapter usdyIdle;
        MockDeFiLendingAdapter mEthDefi;
        MockCeFiEarnAdapter fBtcCefi;
        MockDeFiLendingAdapter mi4Defi;
    }

    /// @notice Deploys the full mock Equinox core stack for testnet or local testing.
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address vaultOwner = vm.envAddress("VAULT_OWNER");
        address authorizedAgent = vm.envAddress("AUTHORIZED_AGENT");
        address agentWallet = vm.envAddress("AGENT_WALLET");

        vm.startBroadcast(deployerPrivateKey);

        CoreContracts memory core = _deployCoreContracts(deployer, authorizedAgent);

        uint256 agentId = core.registry.registerAgent(vaultOwner, agentWallet, "ipfs://equinox-agent-1");

        address[] memory assets = new address[](4);
        assets[0] = address(core.usdy);
        assets[1] = address(core.mEth);
        assets[2] = address(core.fBtc);
        assets[3] = address(core.mi4);

        uint8[] memory riskTiers = new uint8[](4);
        riskTiers[0] = 0;
        riskTiers[1] = 1;
        riskTiers[2] = 2;
        riskTiers[3] = 2;

        uint16[3][] memory maxAllocationBps = new uint16[3][](4);
        maxAllocationBps[0] = [uint16(7_000), uint16(5_000), uint16(3_500)];
        maxAllocationBps[1] = [uint16(3_500), uint16(4_500), uint16(5_000)];
        maxAllocationBps[2] = [uint16(2_000), uint16(3_000), uint16(4_000)];
        maxAllocationBps[3] = [uint16(1_500), uint16(2_500), uint16(3_500)];

        MantleVaultOrchestrator vault = new MantleVaultOrchestrator(
            vaultOwner,
            authorizedAgent,
            core.registry,
            core.strategyRegistry,
            core.exchange,
            agentId,
            RiskProfile.Balanced,
            assets,
            riskTiers,
            maxAllocationBps
        );

        core.registry.grantRole(core.registry.LOGGER_ROLE(), address(vault));

        address vaultFactory = _deployVaultFactory(
            core.registry,
            core.strategyRegistry,
            core.exchange,
            authorizedAgent,
            agentWallet,
            assets,
            riskTiers,
            maxAllocationBps
        );

        _setInitialPrices(core.exchange, address(core.usdy), address(core.mEth), address(core.fBtc), address(core.mi4));
        _setInitialSnapshots(core.usdyIdle, core.mEthDefi, core.fBtcCefi, core.mi4Defi);

        core.usdy.mint(vaultOwner, vm.envOr("INITIAL_VAULT_OWNER_MINT", uint256(100_000e18)));

        vm.stopBroadcast();

        console2.log("=== Equinox Core Deployed ===");
        console2.log("Mock USDY:", address(core.usdy));
        console2.log("Mock mETH:", address(core.mEth));
        console2.log("Mock fBTC:", address(core.fBtc));
        console2.log("Mock MI4:", address(core.mi4));
        console2.log("Exchange:", address(core.exchange));
        console2.log("Strategy Registry:", address(core.strategyRegistry));
        console2.log("Agent Registry:", address(core.registry));
        console2.log("Vault Factory:", address(vaultFactory));
        console2.log("USDY Idle Adapter:", address(core.usdyIdle));
        console2.log("mETH DeFi Adapter:", address(core.mEthDefi));
        console2.log("fBTC CeFi Adapter:", address(core.fBtcCefi));
        console2.log("MI4 DeFi Adapter:", address(core.mi4Defi));
        console2.log("Vault:", address(vault));
        console2.log("Agent ID:", agentId);
    }

    function _deployCoreContracts(address deployer, address authorizedAgent)
        internal
        returns (CoreContracts memory core)
    {
        core.usdy = new MockAssetToken("Mock USDY", "mUSDY", deployer);
        core.mEth = new MockAssetToken("Mock mETH", "mmETH", deployer);
        core.fBtc = new MockAssetToken("Mock fBTC", "mfBTC", deployer);
        core.mi4 = new MockAssetToken("Mock MI4", "mMI4", deployer);

        core.exchange = new MockAssetExchange(deployer, deployer, 0);
        core.strategyRegistry = new StrategyRegistry(deployer);
        core.registry =
            new MantleAgentRegistry8004("Equinox Agent Registry", "EQAGENT", "ipfs://equinox-agent-registry", deployer);

        core.usdyIdle = new MockIdleAdapter(address(core.usdy), deployer, deployer);
        core.mEthDefi = new MockDeFiLendingAdapter(address(core.mEth), deployer, deployer);
        core.fBtcCefi = new MockCeFiEarnAdapter(address(core.fBtc), deployer, deployer);
        core.mi4Defi = new MockDeFiLendingAdapter(address(core.mi4), deployer, deployer);

        _grantTokenRoles(core);
        _grantOperatorRoles(core, authorizedAgent);
        _registerStrategies(core);
    }

    function _grantTokenRoles(CoreContracts memory core) internal {
        core.usdy.grantRole(core.usdy.MINTER_ROLE(), address(core.exchange));
        core.usdy.grantRole(core.usdy.BURNER_ROLE(), address(core.exchange));
        core.mEth.grantRole(core.mEth.MINTER_ROLE(), address(core.exchange));
        core.mEth.grantRole(core.mEth.BURNER_ROLE(), address(core.exchange));
        core.fBtc.grantRole(core.fBtc.MINTER_ROLE(), address(core.exchange));
        core.fBtc.grantRole(core.fBtc.BURNER_ROLE(), address(core.exchange));
        core.mi4.grantRole(core.mi4.MINTER_ROLE(), address(core.exchange));
        core.mi4.grantRole(core.mi4.BURNER_ROLE(), address(core.exchange));

        core.usdy.grantRole(core.usdy.MINTER_ROLE(), address(core.usdyIdle));
        core.mEth.grantRole(core.mEth.MINTER_ROLE(), address(core.mEthDefi));
        core.fBtc.grantRole(core.fBtc.MINTER_ROLE(), address(core.fBtcCefi));
        core.mi4.grantRole(core.mi4.MINTER_ROLE(), address(core.mi4Defi));
    }

    function _grantOperatorRoles(CoreContracts memory core, address authorizedAgent) internal {
        core.exchange.grantRole(core.exchange.OPERATOR_ROLE(), authorizedAgent);
        core.usdyIdle.grantRole(core.usdyIdle.OPERATOR_ROLE(), authorizedAgent);
        core.mEthDefi.grantRole(core.mEthDefi.OPERATOR_ROLE(), authorizedAgent);
        core.fBtcCefi.grantRole(core.fBtcCefi.OPERATOR_ROLE(), authorizedAgent);
        core.mi4Defi.grantRole(core.mi4Defi.OPERATOR_ROLE(), authorizedAgent);
    }

    function _registerStrategies(CoreContracts memory core) internal {
        core.strategyRegistry.registerStrategy(address(core.usdy), address(core.usdyIdle));
        core.strategyRegistry.registerStrategy(address(core.mEth), address(core.mEthDefi));
        core.strategyRegistry.registerStrategy(address(core.fBtc), address(core.fBtcCefi));
        core.strategyRegistry.registerStrategy(address(core.mi4), address(core.mi4Defi));
    }

    function _deployVaultFactory(
        MantleAgentRegistry8004 registry,
        StrategyRegistry strategyRegistry,
        MockAssetExchange exchange,
        address authorizedAgent,
        address agentWallet,
        address[] memory assets,
        uint8[] memory riskTiers,
        uint16[3][] memory maxAllocationBps
    ) internal returns (address vaultFactory) {
        vaultFactory = address(
            new VaultFactory(
                registry,
                strategyRegistry,
                exchange,
                authorizedAgent,
                agentWallet,
                RiskProfile.Balanced,
                assets,
                riskTiers,
                maxAllocationBps
            )
        );

        registry.grantRole(registry.DEFAULT_ADMIN_ROLE(), vaultFactory);
        registry.grantRole(registry.REGISTRAR_ROLE(), vaultFactory);
    }

    function _setInitialPrices(MockAssetExchange exchange, address usdy, address mEth, address fBtc, address mi4)
        internal
    {
        exchange.setAssetPrice(usdy, vm.envOr("USDY_PRICE_E18", uint256(1e18)));
        exchange.setAssetPrice(mEth, vm.envOr("METH_PRICE_E18", uint256(2_500e18)));
        exchange.setAssetPrice(fBtc, vm.envOr("FBTC_PRICE_E18", uint256(60_000e18)));
        exchange.setAssetPrice(mi4, vm.envOr("MI4_PRICE_E18", uint256(150e18)));
    }

    function _setInitialSnapshots(
        MockIdleAdapter usdyIdle,
        MockDeFiLendingAdapter mEthDefi,
        MockCeFiEarnAdapter fBtcCefi,
        MockDeFiLendingAdapter mi4Defi
    ) internal {
        usdyIdle.setMarketSnapshot(
            uint32(vm.envOr("USDY_IDLE_APY_BPS", uint256(120))),
            uint16(vm.envOr("USDY_IDLE_RISK_SCORE", uint256(10))),
            uint16(vm.envOr("USDY_IDLE_LIQUIDITY_SCORE", uint256(95))),
            uint64(block.timestamp),
            keccak256("USDY_IDLE_BOOTSTRAP")
        );
        mEthDefi.setMarketSnapshot(
            uint32(vm.envOr("METH_DEFI_APY_BPS", uint256(780))),
            uint16(vm.envOr("METH_DEFI_RISK_SCORE", uint256(45))),
            uint16(vm.envOr("METH_DEFI_LIQUIDITY_SCORE", uint256(82))),
            uint64(block.timestamp),
            keccak256("METH_DEFI_BOOTSTRAP")
        );
        fBtcCefi.setMarketSnapshot(
            uint32(vm.envOr("FBTC_CEFI_APY_BPS", uint256(900))),
            uint16(vm.envOr("FBTC_CEFI_RISK_SCORE", uint256(65))),
            uint16(vm.envOr("FBTC_CEFI_LIQUIDITY_SCORE", uint256(75))),
            uint64(block.timestamp),
            keccak256("FBTC_CEFI_BOOTSTRAP")
        );
        mi4Defi.setMarketSnapshot(
            uint32(vm.envOr("MI4_DEFI_APY_BPS", uint256(1_050))),
            uint16(vm.envOr("MI4_DEFI_RISK_SCORE", uint256(55))),
            uint16(vm.envOr("MI4_DEFI_LIQUIDITY_SCORE", uint256(70))),
            uint64(block.timestamp),
            keccak256("MI4_DEFI_BOOTSTRAP")
        );
    }
}
