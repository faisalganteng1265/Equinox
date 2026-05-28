// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {MockAssetToken} from "../src/mocks/MockAssetToken.sol";
import {MockIdleAdapter} from "../src/adapters/MockIdleAdapter.sol";
import {PreviewResult, RebalanceRejectionReason, StrategyTarget} from "../src/common/Types.sol";
import {EquinoxVaultFixture} from "./utils/EquinoxVaultFixture.sol";

contract MantleVaultOrchestratorFuzzTest is EquinoxVaultFixture {
    /// @notice Boots the shared Equinox vault fixture.
    function setUp() public {
        _setUpVaultFixture();
    }

    /// @notice Verifies that weight-sum mismatch is detected across a broad set of valid per-asset weights.
    /// @param usdyWeight Raw weight candidate for USDY.
    /// @param mEthWeight Raw weight candidate for mETH.
    /// @param fBtcWeight Raw weight candidate for fBTC.
    function testFuzz_previewRebalance_flagsWeightMismatch(uint16 usdyWeight, uint16 mEthWeight, uint16 fBtcWeight)
        public
        view
    {
        usdyWeight = uint16(bound(usdyWeight, 0, 5_000));
        mEthWeight = uint16(bound(mEthWeight, 0, 4_500));
        fBtcWeight = uint16(bound(fBtcWeight, 0, 3_000));

        uint256 totalWeight = uint256(usdyWeight) + uint256(mEthWeight) + uint256(fBtcWeight);
        vm.assume(totalWeight != 10_000);

        StrategyTarget[] memory targets = new StrategyTarget[](3);
        targets[0] = StrategyTarget(address(usdy), address(usdyIdle), usdyWeight);
        targets[1] = StrategyTarget(address(mEth), address(mEthDefi), mEthWeight);
        targets[2] = StrategyTarget(address(fBtc), address(fBtcCefi), fBtcWeight);

        PreviewResult memory preview = vault.previewRebalance(targets);
        assertFalse(preview.ok);
        assertEq(uint8(preview.reason), uint8(RebalanceRejectionReason.WeightSumMismatch));
        assertEq(preview.totalWeightBps, totalWeight);
    }

    /// @notice Verifies that duplicate asset-adapter targets are always rejected.
    /// @param duplicateWeight Weight used by the duplicated target.
    function testFuzz_previewRebalance_flagsDuplicateTarget(uint16 duplicateWeight) public view {
        duplicateWeight = uint16(bound(duplicateWeight, 0, 5_000));

        StrategyTarget[] memory targets = new StrategyTarget[](2);
        targets[0] = StrategyTarget(address(usdy), address(usdyIdle), duplicateWeight);
        targets[1] = StrategyTarget(address(usdy), address(usdyIdle), uint16(10_000 - duplicateWeight));

        PreviewResult memory preview = vault.previewRebalance(targets);
        assertFalse(preview.ok);
        assertEq(uint8(preview.reason), uint8(RebalanceRejectionReason.DuplicateTarget));
        assertEq(preview.offendingAsset, address(usdy));
        assertEq(preview.offendingAdapter, address(usdyIdle));
    }

    /// @notice Verifies that unapproved adapters are rejected even when the asset itself is supported.
    /// @param targetWeight Weight requested for the rogue adapter.
    function testFuzz_previewRebalance_flagsUnsupportedAdapter(uint16 targetWeight) public {
        targetWeight = uint16(bound(targetWeight, 0, 10_000));

        vm.prank(admin);
        MockIdleAdapter rogueAdapter = new MockIdleAdapter(address(usdy), admin, authorizedAgent);

        StrategyTarget[] memory targets = new StrategyTarget[](1);
        targets[0] = StrategyTarget(address(usdy), address(rogueAdapter), targetWeight);

        PreviewResult memory preview = vault.previewRebalance(targets);
        assertFalse(preview.ok);
        assertEq(uint8(preview.reason), uint8(RebalanceRejectionReason.UnapprovedAdapter));
        assertEq(preview.offendingAsset, address(usdy));
        assertEq(preview.offendingAdapter, address(rogueAdapter));
    }

    /// @notice Verifies that unsupported assets are rejected during preview.
    /// @param targetWeight Weight requested for the unsupported asset.
    function testFuzz_previewRebalance_flagsUnsupportedAsset(uint16 targetWeight) public {
        targetWeight = uint16(bound(targetWeight, 0, 10_000));

        vm.startPrank(admin);
        MockAssetToken rogueAsset = new MockAssetToken("ROGUE", "ROGUE", admin);
        MockIdleAdapter rogueAdapter = new MockIdleAdapter(address(rogueAsset), admin, authorizedAgent);
        vm.stopPrank();

        StrategyTarget[] memory targets = new StrategyTarget[](1);
        targets[0] = StrategyTarget(address(rogueAsset), address(rogueAdapter), targetWeight);

        PreviewResult memory preview = vault.previewRebalance(targets);
        assertFalse(preview.ok);
        assertEq(uint8(preview.reason), uint8(RebalanceRejectionReason.UnsupportedAsset));
        assertEq(preview.offendingAsset, address(rogueAsset));
    }

    /// @notice Verifies that withdrawing more than total exposure still reverts across many owner deposit sizes.
    /// @param depositAmount Raw deposit amount to place into the vault.
    /// @param extraAmount Raw excess amount above exposure.
    function testFuzz_withdraw_revertsWhenAmountExceedsExposure(uint96 depositAmount, uint96 extraAmount) public {
        depositAmount = uint96(bound(uint256(depositAmount), 1e18, 100_000e18));
        extraAmount = uint96(bound(uint256(extraAmount), 1, 10_000e18));

        vm.startPrank(vaultOwner);
        usdy.approve(address(vault), depositAmount);
        vault.deposit(address(usdy), depositAmount);
        vm.expectRevert();
        vault.withdraw(address(usdy), depositAmount + extraAmount, recipient);
        vm.stopPrank();
    }

    /// @notice Verifies that logging a rejected rebalance never moves owner capital.
    /// @param depositAmount Raw deposit amount to place into the vault before rejection logging.
    /// @param fBtcWeight Requested fBTC weight above the balanced-profile limit.
    function testFuzz_recordRejectedDecision_preservesExposure(uint96 depositAmount, uint16 fBtcWeight) public {
        depositAmount = uint96(bound(uint256(depositAmount), 1e18, 100_000e18));
        fBtcWeight = uint16(bound(fBtcWeight, 3_001, 4_000));

        vm.startPrank(vaultOwner);
        usdy.approve(address(vault), depositAmount);
        vault.deposit(address(usdy), depositAmount);
        vm.stopPrank();

        uint256 portfolioValueBefore = vault.totalPortfolioValueE18();
        uint256 usdyBalanceBefore = usdy.balanceOf(address(vault));
        uint256 decisionCountBefore = registry.getDecisionCount(agentId);

        StrategyTarget[] memory targets = new StrategyTarget[](2);
        targets[0] = StrategyTarget(address(fBtc), address(fBtcCefi), fBtcWeight);
        targets[1] = StrategyTarget(address(usdy), address(usdyIdle), uint16(10_000 - fBtcWeight));

        vm.prank(authorizedAgent);
        vault.recordRejectedDecision(targets, keccak256("blocked-fuzz"), "ipfs://blocked-fuzz");

        assertEq(vault.totalPortfolioValueE18(), portfolioValueBefore);
        assertEq(usdy.balanceOf(address(vault)), usdyBalanceBefore);
        assertEq(registry.getDecisionCount(agentId), decisionCountBefore + 1);
    }
}
