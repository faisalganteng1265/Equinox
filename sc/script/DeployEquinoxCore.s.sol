// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {console2} from "forge-std/console2.sol";
import {Script} from "forge-std/Script.sol";

import {MantleAgentRegistry8004} from "../src/MantleAgentRegistry8004.sol";
import {MantleVaultOrchestrator} from "../src/MantleVaultOrchestrator.sol";
import {MockAssetExchange} from "../src/MockAssetExchange.sol";
import {StrategyRegistry} from "../src/StrategyRegistry.sol";
import {MockCeFiEarnAdapter} from "../src/adapters/MockCeFiEarnAdapter.sol";
import {MockDeFiLendingAdapter} from "../src/adapters/MockDeFiLendingAdapter.sol";
import {MockIdleAdapter} from "../src/adapters/MockIdleAdapter.sol";
import {RiskProfile} from "../src/common/Types.sol";
import {MockAssetToken} from "../src/mocks/MockAssetToken.sol";

contract DeployEquinoxCore is Script {
    /// @notice Deploys the full mock Equinox core stack for testnet or local testing.
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address vaultOwner = vm.envAddress("VAULT_OWNER");
        address authorizedAgent = vm.envAddress("AUTHORIZED_AGENT");
        address agentWallet = vm.envAddress("AGENT_WALLET");

        uint256 initialVaultOwnerMint = vm.envOr("INITIAL_VAULT_OWNER_MINT", uint256(100_000e18));
        uint256 usdyPriceE18 = vm.envOr("USDY_PRICE_E18", uint256(1e18));
        uint256 mEthPriceE18 = vm.envOr("METH_PRICE_E18", uint256(2_500e18));
        uint256 fBtcPriceE18 = vm.envOr("FBTC_PRICE_E18", uint256(60_000e18));
        uint256 mi4PriceE18 = vm.envOr("MI4_PRICE_E18", uint256(150e18));
        uint32 usdyIdleApyBps = uint32(vm.envOr("USDY_IDLE_APY_BPS", uint256(120)));
        uint32 mEthDefiApyBps = uint32(vm.envOr("METH_DEFI_APY_BPS", uint256(780)));
        uint32 fBtcCefiApyBps = uint32(vm.envOr("FBTC_CEFI_APY_BPS", uint256(900)));
        uint32 mi4DefiApyBps = uint32(vm.envOr("MI4_DEFI_APY_BPS", uint256(1_050)));
        uint16 usdyIdleRiskScore = uint16(vm.envOr("USDY_IDLE_RISK_SCORE", uint256(10)));
        uint16 mEthDefiRiskScore = uint16(vm.envOr("METH_DEFI_RISK_SCORE", uint256(45)));
        uint16 fBtcCefiRiskScore = uint16(vm.envOr("FBTC_CEFI_RISK_SCORE", uint256(65)));
        uint16 mi4DefiRiskScore = uint16(vm.envOr("MI4_DEFI_RISK_SCORE", uint256(55)));
        uint16 usdyIdleLiquidityScore = uint16(vm.envOr("USDY_IDLE_LIQUIDITY_SCORE", uint256(95)));
        uint16 mEthDefiLiquidityScore = uint16(vm.envOr("METH_DEFI_LIQUIDITY_SCORE", uint256(82)));
        uint16 fBtcCefiLiquidityScore = uint16(vm.envOr("FBTC_CEFI_LIQUIDITY_SCORE", uint256(75)));
        uint16 mi4DefiLiquidityScore = uint16(vm.envOr("MI4_DEFI_LIQUIDITY_SCORE", uint256(70)));

        vm.startBroadcast(deployerPrivateKey);

        MockAssetToken usdy = new MockAssetToken("Mock USDY", "mUSDY", deployer);
        MockAssetToken mEth = new MockAssetToken("Mock mETH", "mmETH", deployer);
        MockAssetToken fBtc = new MockAssetToken("Mock fBTC", "mfBTC", deployer);
        MockAssetToken mi4 = new MockAssetToken("Mock MI4", "mMI4", deployer);

        MockAssetExchange exchange = new MockAssetExchange(deployer, deployer, 0);
        StrategyRegistry strategyRegistry = new StrategyRegistry(deployer);
        MantleAgentRegistry8004 registry =
            new MantleAgentRegistry8004("Equinox Agent Registry", "EQAGENT", "ipfs://equinox-agent-registry", deployer);

        MockIdleAdapter usdyIdle = new MockIdleAdapter(address(usdy), deployer, deployer);
        MockDeFiLendingAdapter mEthDefi = new MockDeFiLendingAdapter(address(mEth), deployer, deployer);
        MockCeFiEarnAdapter fBtcCefi = new MockCeFiEarnAdapter(address(fBtc), deployer, deployer);
        MockDeFiLendingAdapter mi4Defi = new MockDeFiLendingAdapter(address(mi4), deployer, deployer);

        usdy.grantRole(usdy.MINTER_ROLE(), address(exchange));
        usdy.grantRole(usdy.BURNER_ROLE(), address(exchange));
        mEth.grantRole(mEth.MINTER_ROLE(), address(exchange));
        mEth.grantRole(mEth.BURNER_ROLE(), address(exchange));
        fBtc.grantRole(fBtc.MINTER_ROLE(), address(exchange));
        fBtc.grantRole(fBtc.BURNER_ROLE(), address(exchange));
        mi4.grantRole(mi4.MINTER_ROLE(), address(exchange));
        mi4.grantRole(mi4.BURNER_ROLE(), address(exchange));

        usdy.grantRole(usdy.MINTER_ROLE(), address(usdyIdle));
        mEth.grantRole(mEth.MINTER_ROLE(), address(mEthDefi));
        fBtc.grantRole(fBtc.MINTER_ROLE(), address(fBtcCefi));
        mi4.grantRole(mi4.MINTER_ROLE(), address(mi4Defi));

        exchange.grantRole(exchange.OPERATOR_ROLE(), authorizedAgent);
        usdyIdle.grantRole(usdyIdle.OPERATOR_ROLE(), authorizedAgent);
        mEthDefi.grantRole(mEthDefi.OPERATOR_ROLE(), authorizedAgent);
        fBtcCefi.grantRole(fBtcCefi.OPERATOR_ROLE(), authorizedAgent);
        mi4Defi.grantRole(mi4Defi.OPERATOR_ROLE(), authorizedAgent);

        strategyRegistry.registerStrategy(address(usdy), address(usdyIdle));
        strategyRegistry.registerStrategy(address(mEth), address(mEthDefi));
        strategyRegistry.registerStrategy(address(fBtc), address(fBtcCefi));
        strategyRegistry.registerStrategy(address(mi4), address(mi4Defi));

        uint256 agentId = registry.registerAgent(vaultOwner, agentWallet, "ipfs://equinox-agent-1");

        address[] memory assets = new address[](4);
        assets[0] = address(usdy);
        assets[1] = address(mEth);
        assets[2] = address(fBtc);
        assets[3] = address(mi4);

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
            registry,
            strategyRegistry,
            exchange,
            agentId,
            RiskProfile.Balanced,
            assets,
            riskTiers,
            maxAllocationBps
        );

        registry.grantRole(registry.LOGGER_ROLE(), address(vault));

        exchange.setAssetPrice(address(usdy), usdyPriceE18);
        exchange.setAssetPrice(address(mEth), mEthPriceE18);
        exchange.setAssetPrice(address(fBtc), fBtcPriceE18);
        exchange.setAssetPrice(address(mi4), mi4PriceE18);

        usdyIdle.setMarketSnapshot(
            usdyIdleApyBps,
            usdyIdleRiskScore,
            usdyIdleLiquidityScore,
            uint64(block.timestamp),
            keccak256("USDY_IDLE_BOOTSTRAP")
        );
        mEthDefi.setMarketSnapshot(
            mEthDefiApyBps,
            mEthDefiRiskScore,
            mEthDefiLiquidityScore,
            uint64(block.timestamp),
            keccak256("METH_DEFI_BOOTSTRAP")
        );
        fBtcCefi.setMarketSnapshot(
            fBtcCefiApyBps,
            fBtcCefiRiskScore,
            fBtcCefiLiquidityScore,
            uint64(block.timestamp),
            keccak256("FBTC_CEFI_BOOTSTRAP")
        );
        mi4Defi.setMarketSnapshot(
            mi4DefiApyBps,
            mi4DefiRiskScore,
            mi4DefiLiquidityScore,
            uint64(block.timestamp),
            keccak256("MI4_DEFI_BOOTSTRAP")
        );

        usdy.mint(vaultOwner, initialVaultOwnerMint);

        vm.stopBroadcast();

        console2.log("=== Equinox Core Deployed ===");
        console2.log("Mock USDY:", address(usdy));
        console2.log("Mock mETH:", address(mEth));
        console2.log("Mock fBTC:", address(fBtc));
        console2.log("Mock MI4:", address(mi4));
        console2.log("Exchange:", address(exchange));
        console2.log("Strategy Registry:", address(strategyRegistry));
        console2.log("Agent Registry:", address(registry));
        console2.log("USDY Idle Adapter:", address(usdyIdle));
        console2.log("mETH DeFi Adapter:", address(mEthDefi));
        console2.log("fBTC CeFi Adapter:", address(fBtcCefi));
        console2.log("MI4 DeFi Adapter:", address(mi4Defi));
        console2.log("Vault:", address(vault));
        console2.log("Agent ID:", agentId);
    }
}
