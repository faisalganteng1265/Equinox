// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Test} from "forge-std/Test.sol";

import {MantleAgentRegistry8004} from "../src/MantleAgentRegistry8004.sol";
import {MantleVaultOrchestrator} from "../src/MantleVaultOrchestrator.sol";
import {MockAssetExchange} from "../src/MockAssetExchange.sol";
import {StrategyRegistry} from "../src/StrategyRegistry.sol";
import {MockCeFiEarnAdapter} from "../src/adapters/MockCeFiEarnAdapter.sol";
import {MockDeFiLendingAdapter} from "../src/adapters/MockDeFiLendingAdapter.sol";
import {MockIdleAdapter} from "../src/adapters/MockIdleAdapter.sol";
import {RebalancePreviewFailed, UnauthorizedAgent, UnsupportedAsset, ZeroAmount} from "../src/common/Errors.sol";
import {
    DecisionRecord,
    PreviewResult,
    RebalanceRejectionReason,
    RiskProfile,
    StrategyTarget
} from "../src/common/Types.sol";
import {MockAssetToken} from "../src/mocks/MockAssetToken.sol";

/// @title Mantle Vault Orchestrator Test
/// @notice Unit tests for deposit, withdraw, preview, and rebalance behavior inside the Equinox vault.
contract MantleVaultOrchestratorTest is Test {
    MantleAgentRegistry8004 internal registry;
    MantleVaultOrchestrator internal vault;
    StrategyRegistry internal strategyRegistry;
    MockAssetExchange internal exchange;

    MockAssetToken internal usdy;
    MockAssetToken internal mEth;
    MockAssetToken internal fBtc;
    MockAssetToken internal mi4;

    MockIdleAdapter internal usdyIdle;
    MockDeFiLendingAdapter internal mEthDefi;
    MockCeFiEarnAdapter internal fBtcCefi;
    MockDeFiLendingAdapter internal mi4Defi;

    address internal admin = makeAddr("admin");
    address internal vaultOwner = makeAddr("vaultOwner");
    address internal authorizedAgent = makeAddr("authorizedAgent");
    address internal agentWallet = makeAddr("agentWallet");
    address internal recipient = makeAddr("recipient");

    uint256 internal agentId;

    /// @notice Deploys the full mock vault environment with assets, adapters, and pricing fixtures.
    function setUp() public {
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

    /// @notice Verifies that deposits move owner funds into the vault.
    function test_deposit_transfersTokensIntoVault() public {
        vm.startPrank(vaultOwner);
        usdy.approve(address(vault), 10_000e18);
        vault.deposit(address(usdy), 10_000e18);
        vm.stopPrank();

        assertEq(usdy.balanceOf(address(vault)), 10_000e18);
    }

    /// @notice Verifies that deposits reject assets outside the approved asset set.
    function test_deposit_revertsForUnsupportedAsset() public {
        vm.prank(admin);
        MockAssetToken rogue = new MockAssetToken("ROGUE", "RGE", admin);
        vm.prank(admin);
        rogue.mint(vaultOwner, 100e18);

        vm.startPrank(vaultOwner);
        rogue.approve(address(vault), 100e18);
        vm.expectRevert(abi.encodeWithSelector(UnsupportedAsset.selector, address(rogue)));
        vault.deposit(address(rogue), 100e18);
        vm.stopPrank();
    }

    /// @notice Verifies that preview identifies an asset cap violation before execution.
    function test_previewRebalance_flagsAssetCapViolation() public view {
        StrategyTarget[] memory targets = new StrategyTarget[](3);
        targets[0] = StrategyTarget(address(usdy), address(usdyIdle), 4_000);
        targets[1] = StrategyTarget(address(fBtc), address(fBtcCefi), 3_500);
        targets[2] = StrategyTarget(address(mEth), address(mEthDefi), 2_500);

        PreviewResult memory preview = vault.previewRebalance(targets);
        assertFalse(preview.ok);
        assertEq(uint8(preview.reason), uint8(RebalanceRejectionReason.AssetRiskLimitExceeded));
        assertEq(preview.offendingAsset, address(fBtc));
    }

    /// @notice Verifies that a rejected rebalance can still be logged on-chain.
    function test_recordRejectedDecision_logsBlockedAttempt() public {
        StrategyTarget[] memory targets = new StrategyTarget[](2);
        targets[0] = StrategyTarget(address(fBtc), address(fBtcCefi), 5_000);
        targets[1] = StrategyTarget(address(usdy), address(usdyIdle), 5_000);

        vm.prank(authorizedAgent);
        vault.recordRejectedDecision(targets, keccak256("blocked-rebalance"), "ipfs://decision-blocked");

        assertEq(registry.getDecisionCount(agentId), 1);
        DecisionRecord memory record = registry.getDecision(agentId, 0);
        assertGt(record.timestamp, 0);
        assertTrue(record.blockedByGuardrail);
        assertEq(record.detailsURI, "ipfs://decision-blocked");
    }

    /// @notice Verifies that execution swaps assets and deploys balances into target strategies.
    function test_executeRebalance_movesFundsAcrossAssetsAndStrategies() public {
        vm.startPrank(vaultOwner);
        usdy.approve(address(vault), 100_000e18);
        vault.deposit(address(usdy), 100_000e18);
        vm.stopPrank();

        StrategyTarget[] memory targets = new StrategyTarget[](4);
        targets[0] = StrategyTarget(address(usdy), address(usdyIdle), 4_000);
        targets[1] = StrategyTarget(address(mEth), address(mEthDefi), 3_000);
        targets[2] = StrategyTarget(address(fBtc), address(fBtcCefi), 2_000);
        targets[3] = StrategyTarget(address(mi4), address(mi4Defi), 1_000);

        vm.prank(authorizedAgent);
        vault.executeRebalance(targets, keccak256("live-rebalance"), "ipfs://decision-live");

        uint256 totalValue = vault.totalPortfolioValueE18();
        uint256 usdyValue = _assetValue(address(usdy), usdyIdle.maxWithdraw(address(vault)));
        uint256 mEthValue = _assetValue(address(mEth), mEthDefi.maxWithdraw(address(vault)));
        uint256 fBtcValue = _assetValue(address(fBtc), fBtcCefi.maxWithdraw(address(vault)));
        uint256 mi4Value = _assetValue(address(mi4), mi4Defi.maxWithdraw(address(vault)));

        assertApproxEqAbs(usdyValue, (totalValue * 4_000) / 10_000, 3e18);
        assertApproxEqAbs(mEthValue, (totalValue * 3_000) / 10_000, 3e18);
        assertApproxEqAbs(fBtcValue, (totalValue * 2_000) / 10_000, 3e18);
        assertApproxEqAbs(mi4Value, (totalValue * 1_000) / 10_000, 3e18);

        assertEq(vault.getAssetTargetWeight(address(usdy)), 4_000);
        assertEq(vault.getStrategyTargetWeight(address(mEth), address(mEthDefi)), 3_000);
        assertEq(registry.getDecisionCount(agentId), 1);
    }

    /// @notice Verifies that only the authorized backend agent can execute rebalances.
    function test_executeRebalance_revertsForUnauthorizedCaller() public {
        StrategyTarget[] memory targets = new StrategyTarget[](1);
        targets[0] = StrategyTarget(address(usdy), address(usdyIdle), 10_000);

        vm.prank(vaultOwner);
        vm.expectRevert(abi.encodeWithSelector(UnauthorizedAgent.selector, vaultOwner));
        vault.executeRebalance(targets, keccak256("rebalance"), "ipfs://decision");
    }

    /// @notice Verifies that execution reverts when preview validation fails.
    function test_executeRebalance_revertsWhenPreviewFails() public {
        StrategyTarget[] memory targets = new StrategyTarget[](2);
        targets[0] = StrategyTarget(address(fBtc), address(fBtcCefi), 5_000);
        targets[1] = StrategyTarget(address(usdy), address(usdyIdle), 5_000);

        vm.prank(authorizedAgent);
        vm.expectRevert();
        vault.executeRebalance(targets, keccak256("rebalance"), "ipfs://decision");
    }

    /// @notice Verifies that withdrawals can pull funds back from strategy adapters.
    function test_withdraw_pullsFundsBackFromStrategies() public {
        vm.startPrank(vaultOwner);
        usdy.approve(address(vault), 50_000e18);
        vault.deposit(address(usdy), 50_000e18);
        vm.stopPrank();

        StrategyTarget[] memory targets = new StrategyTarget[](3);
        targets[0] = StrategyTarget(address(usdy), address(usdyIdle), 5_000);
        targets[1] = StrategyTarget(address(mEth), address(mEthDefi), 4_500);
        targets[2] = StrategyTarget(address(mi4), address(mi4Defi), 500);

        vm.prank(authorizedAgent);
        vault.executeRebalance(targets, keccak256("split-usdy-meth"), "ipfs://decision-split");

        vm.prank(vaultOwner);
        vault.withdraw(address(usdy), 10_000e18, recipient);

        assertEq(usdy.balanceOf(recipient), 10_000e18);
    }

    /// @notice Verifies that zero-amount withdrawals are rejected.
    function test_withdraw_revertsForZeroAmount() public {
        vm.prank(vaultOwner);
        vm.expectRevert(abi.encodeWithSelector(ZeroAmount.selector));
        vault.withdraw(address(usdy), 0, recipient);
    }

    function _assetValue(address asset, uint256 amount) internal view returns (uint256 valueE18) {
        return (amount * exchange.assetPriceE18(asset)) / 1e18;
    }
}
