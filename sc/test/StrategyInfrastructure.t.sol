// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Test} from "forge-std/Test.sol";

import {MockAssetExchange} from "../src/MockAssetExchange.sol";
import {MockDeFiLendingAdapter} from "../src/adapters/MockDeFiLendingAdapter.sol";
import {MockAssetToken} from "../src/mocks/MockAssetToken.sol";

/// @title Strategy Infrastructure Test
/// @notice Isolated tests for the mock exchange and adapter primitives.
contract StrategyInfrastructureTest is Test {
    MockAssetToken internal usdy;
    MockAssetToken internal mEth;
    MockAssetExchange internal exchange;
    MockDeFiLendingAdapter internal adapter;

    address internal admin = makeAddr("admin");
    address internal operator = makeAddr("operator");
    address internal vault = makeAddr("vault");

    /// @notice Deploys mock exchange and adapter infrastructure for isolated testing.
    function setUp() public {
        vm.startPrank(admin);
        usdy = new MockAssetToken("USDY", "USDY", admin);
        mEth = new MockAssetToken("mETH", "mETH", admin);
        exchange = new MockAssetExchange(admin, operator, 0);
        adapter = new MockDeFiLendingAdapter(address(usdy), admin, operator);

        usdy.grantRole(usdy.MINTER_ROLE(), address(adapter));
        usdy.grantRole(usdy.BURNER_ROLE(), address(exchange));
        mEth.grantRole(mEth.MINTER_ROLE(), address(exchange));
        vm.stopPrank();

        vm.startPrank(operator);
        exchange.setAssetPrice(address(usdy), 1e18);
        exchange.setAssetPrice(address(mEth), 2_500e18);
        adapter.setMarketSnapshot(600, 35, 80, uint64(block.timestamp), keccak256("defi-market"));
        vm.stopPrank();

        vm.prank(admin);
        usdy.mint(vault, 10_000e18);
    }

    /// @notice Verifies that the mock exchange swaps assets using configured prices.
    function test_mockExchange_swapsUsingConfiguredPrices() public {
        vm.startPrank(vault);
        usdy.approve(address(exchange), 2_500e18);
        uint256 amountOut = exchange.swapExactInput(address(usdy), address(mEth), 2_500e18, 0, vault);
        vm.stopPrank();

        assertEq(amountOut, 1e18);
        assertEq(mEth.balanceOf(vault), 1e18);
        assertEq(usdy.balanceOf(vault), 7_500e18);
    }

    /// @notice Verifies that the adapter accrues simulated yield over time.
    function test_mockAdapter_accruesYieldOverTime() public {
        vm.startPrank(vault);
        usdy.approve(address(adapter), 10_000e18);
        adapter.deposit(10_000e18);
        vm.stopPrank();

        vm.warp(block.timestamp + 365 days);
        adapter.syncYield();

        assertEq(adapter.totalManagedAssets(), 10_600e18);
        assertEq(adapter.maxWithdraw(vault), 10_600e18);
    }
}
