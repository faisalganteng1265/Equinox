// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Test} from "forge-std/Test.sol";

import {MockAssetExchange} from "../src/MockAssetExchange.sol";
import {StrategyRegistry} from "../src/StrategyRegistry.sol";
import {MantleVaultOrchestrator} from "../src/MantleVaultOrchestrator.sol";
import {MockCeFiEarnAdapter} from "../src/adapters/MockCeFiEarnAdapter.sol";
import {MockDeFiLendingAdapter} from "../src/adapters/MockDeFiLendingAdapter.sol";
import {MockIdleAdapter} from "../src/adapters/MockIdleAdapter.sol";
import {RiskProfile, StrategyTarget} from "../src/common/Types.sol";
import {MockAssetToken} from "../src/mocks/MockAssetToken.sol";
import {EquinoxVaultFixture} from "./utils/EquinoxVaultFixture.sol";

contract VaultHandler is Test {
    MantleVaultOrchestrator internal immutable vault;
    StrategyRegistry internal immutable strategyRegistry;
    MockAssetExchange internal immutable exchange;

    MockAssetToken internal immutable usdy;
    MockAssetToken internal immutable mEth;
    MockAssetToken internal immutable fBtc;
    MockAssetToken internal immutable mi4;

    MockIdleAdapter internal immutable usdyIdle;
    MockDeFiLendingAdapter internal immutable mEthDefi;
    MockCeFiEarnAdapter internal immutable fBtcCefi;
    MockDeFiLendingAdapter internal immutable mi4Defi;

    address internal immutable vaultOwner;
    address internal immutable authorizedAgent;
    address internal immutable recipient;

    /// @notice Seeds the handler with the shared fixture dependencies used by the invariant suite.
    constructor(EquinoxVaultFixture fixture) {
        vault = fixture.vault();
        strategyRegistry = fixture.strategyRegistry();
        exchange = fixture.exchange();
        usdy = fixture.usdy();
        mEth = fixture.mEth();
        fBtc = fixture.fBtc();
        mi4 = fixture.mi4();
        usdyIdle = fixture.usdyIdle();
        mEthDefi = fixture.mEthDefi();
        fBtcCefi = fixture.fBtcCefi();
        mi4Defi = fixture.mi4Defi();
        vaultOwner = fixture.vaultOwner();
        authorizedAgent = fixture.authorizedAgent();
        recipient = fixture.recipient();
    }

    /// @notice Randomly deposits owner USDY into the vault.
    function depositUsdy(uint96 amount) external {
        uint256 ownerBalance = usdy.balanceOf(vaultOwner);
        if (ownerBalance == 0) {
            return;
        }

        amount = uint96(bound(uint256(amount), 1, ownerBalance));

        vm.startPrank(vaultOwner);
        usdy.approve(address(vault), amount);
        vault.deposit(address(usdy), amount);
        vm.stopPrank();
    }

    /// @notice Executes a valid balanced rebalance target set.
    function executeBalancedPlan() external {
        StrategyTarget[] memory targets = new StrategyTarget[](4);
        targets[0] = StrategyTarget(address(usdy), address(usdyIdle), 4_000);
        targets[1] = StrategyTarget(address(mEth), address(mEthDefi), 3_000);
        targets[2] = StrategyTarget(address(fBtc), address(fBtcCefi), 2_000);
        targets[3] = StrategyTarget(address(mi4), address(mi4Defi), 1_000);

        vm.prank(vaultOwner);
        vault.setRiskProfile(RiskProfile.Balanced);

        vm.prank(authorizedAgent);
        vault.executeRebalance(targets, keccak256("invariant-balanced"), "ipfs://invariant-balanced");
    }

    /// @notice Records an invalid blocked decision without moving funds.
    function recordBlockedPlan() external {
        StrategyTarget[] memory targets = new StrategyTarget[](2);
        targets[0] = StrategyTarget(address(fBtc), address(fBtcCefi), 5_000);
        targets[1] = StrategyTarget(address(usdy), address(usdyIdle), 5_000);

        vm.prank(authorizedAgent);
        vault.recordRejectedDecision(targets, keccak256("invariant-blocked"), "ipfs://invariant-blocked");
    }

    /// @notice Withdraws a bounded amount of USDY when exposure exists.
    function withdrawUsdy(uint96 amount) external {
        uint256 available = vault.getCurrentAssetExposure(address(usdy));
        if (available == 0) {
            return;
        }

        amount = uint96(bound(uint256(amount), 1, available));
        vm.prank(vaultOwner);
        vault.withdraw(address(usdy), amount, recipient);
    }
}

contract MantleVaultOrchestratorInvariantTest is EquinoxVaultFixture {
    VaultHandler internal handler;

    /// @notice Boots the shared fixture and binds the invariant handler.
    function setUp() public {
        _setUpVaultFixture();
        handler = new VaultHandler(this);
        targetContract(address(handler));
    }

    /// @notice Verifies that asset and strategy target weights always remain internally consistent.
    function invariant_targetWeightsStayConsistent() public view {
        address[] memory assets = vault.getTrackedAssets();
        uint256 totalWeight;

        for (uint256 i = 0; i < assets.length; i++) {
            uint256 assetWeight = vault.getAssetTargetWeight(assets[i]);
            totalWeight += assetWeight;

            address[] memory strategies = strategyRegistry.getStrategies(assets[i]);
            uint256 strategyWeightSum;
            for (uint256 j = 0; j < strategies.length; j++) {
                strategyWeightSum += vault.getStrategyTargetWeight(assets[i], strategies[j]);
            }

            assertEq(strategyWeightSum, assetWeight);
        }

        assertTrue(totalWeight == 0 || totalWeight == 10_000);
    }

    /// @notice Verifies that all tracked assets keep a live price and enabled policy inside the mock environment.
    function invariant_pricesAndPoliciesStayConfigured() public view {
        address[] memory assets = vault.getTrackedAssets();

        for (uint256 i = 0; i < assets.length; i++) {
            assertGt(exchange.assetPriceE18(assets[i]), 0);
            assertTrue(vault.getAssetPolicy(assets[i]).enabled);
        }
    }
}
