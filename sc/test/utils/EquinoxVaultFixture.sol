// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Test} from "forge-std/Test.sol";

import {MantleAgentRegistry8004} from "../../src/MantleAgentRegistry8004.sol";
import {MantleVaultOrchestrator} from "../../src/MantleVaultOrchestrator.sol";
import {MockAssetExchange} from "../../src/MockAssetExchange.sol";
import {StrategyRegistry} from "../../src/StrategyRegistry.sol";
import {MockCeFiEarnAdapter} from "../../src/adapters/MockCeFiEarnAdapter.sol";
import {MockDeFiLendingAdapter} from "../../src/adapters/MockDeFiLendingAdapter.sol";
import {MockIdleAdapter} from "../../src/adapters/MockIdleAdapter.sol";
import {RiskProfile} from "../../src/common/Types.sol";
import {MockAssetToken} from "../../src/mocks/MockAssetToken.sol";

/// @title Equinox Vault Fixture
/// @notice Shared fixture that boots the standard Equinox mock stack for unit, fuzz, and invariant tests.
abstract contract EquinoxVaultFixture is Test {
    MantleAgentRegistry8004 public registry;
    MantleVaultOrchestrator public vault;
    StrategyRegistry public strategyRegistry;
    MockAssetExchange public exchange;

    MockAssetToken public usdy;
    MockAssetToken public mEth;
    MockAssetToken public fBtc;
    MockAssetToken public mi4;

    MockIdleAdapter public usdyIdle;
    MockDeFiLendingAdapter public mEthDefi;
    MockCeFiEarnAdapter public fBtcCefi;
    MockDeFiLendingAdapter public mi4Defi;

    address public admin = makeAddr("admin");
    address public vaultOwner = makeAddr("vaultOwner");
    address public authorizedAgent = makeAddr("authorizedAgent");
    address public agentWallet = makeAddr("agentWallet");
    address public recipient = makeAddr("recipient");

    uint256 public agentId;

    /// @notice Deploys the standard Equinox mock environment for tests.
    function _setUpVaultFixture() internal {
        vm.startPrank(admin);
        usdy = new MockAssetToken("USDY", "USDY", admin);
        mEth = new MockAssetToken("mETH", "mETH", admin);
        fBtc = new MockAssetToken("fBTC", "fBTC", admin);
        mi4 = new MockAssetToken("MI4", "MI4", admin);

        exchange = new MockAssetExchange(admin, authorizedAgent, 0);
        strategyRegistry = new StrategyRegistry(admin);
        registry = new MantleAgentRegistry8004("Equinox Agent Registry", "EQAGENT", "ipfs://registry-contract", admin);
        agentId = registry.registerAgent(vaultOwner, agentWallet, "ipfs://agent-1");

        usdyIdle = new MockIdleAdapter(address(usdy), admin, authorizedAgent);
        mEthDefi = new MockDeFiLendingAdapter(address(mEth), admin, authorizedAgent);
        fBtcCefi = new MockCeFiEarnAdapter(address(fBtc), admin, authorizedAgent);
        mi4Defi = new MockDeFiLendingAdapter(address(mi4), admin, authorizedAgent);

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

        strategyRegistry.registerStrategy(address(usdy), address(usdyIdle));
        strategyRegistry.registerStrategy(address(mEth), address(mEthDefi));
        strategyRegistry.registerStrategy(address(fBtc), address(fBtcCefi));
        strategyRegistry.registerStrategy(address(mi4), address(mi4Defi));

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

        vault = new MantleVaultOrchestrator(
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
        vm.stopPrank();

        vm.startPrank(authorizedAgent);
        exchange.setAssetPrice(address(usdy), 1e18);
        exchange.setAssetPrice(address(mEth), 2_500e18);
        exchange.setAssetPrice(address(fBtc), 60_000e18);
        exchange.setAssetPrice(address(mi4), 150e18);

        usdyIdle.setMarketSnapshot(120, 10, 95, uint64(block.timestamp), keccak256("usdy-idle"));
        mEthDefi.setMarketSnapshot(780, 45, 82, uint64(block.timestamp), keccak256("meth-defi"));
        fBtcCefi.setMarketSnapshot(900, 65, 75, uint64(block.timestamp), keccak256("fbtc-cefi"));
        mi4Defi.setMarketSnapshot(1_050, 55, 70, uint64(block.timestamp), keccak256("mi4-defi"));
        vm.stopPrank();

        vm.prank(admin);
        usdy.mint(vaultOwner, 100_000e18);
    }
}
