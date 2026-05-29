// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {
    InvalidPrice,
    InvalidSwapFee,
    MissingAssetPrice,
    SlippageExceeded,
    ZeroAddress,
    ZeroAmount
} from "./common/Errors.sol";
import {IMockAssetExchange} from "./interfaces/IMockAssetExchange.sol";
import {IMintableBurnableERC20} from "./interfaces/IMintableBurnableERC20.sol";

/// @title Equinox Mock Asset Exchange
/// @notice Deterministic price-based swap venue for simulated asset rotation in testnet flows.
contract MockAssetExchange is AccessControl, Pausable, ReentrancyGuard, IMockAssetExchange {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    uint16 public constant TOTAL_BPS = 10_000;

    uint16 public swapFeeBps;
    mapping(address => uint256) private _assetPricesE18;

    event SwapFeeUpdated(address indexed caller, uint16 swapFeeBps);
    event AssetPriceUpdated(address indexed caller, address indexed asset, uint256 priceE18);
    event AssetsSwapped(
        address indexed caller,
        address indexed assetIn,
        address indexed assetOut,
        uint256 amountIn,
        uint256 amountOut,
        address recipient
    );

    /// @notice Deploys the mock exchange with admin and operator roles.
    /// @param admin_ Initial admin for pause and fee management.
    /// @param operator_ Initial operator for market price updates.
    /// @param swapFeeBps_ Swap fee in basis points applied to every quote and swap.
    constructor(address admin_, address operator_, uint16 swapFeeBps_) {
        if (admin_ == address(0) || operator_ == address(0)) revert ZeroAddress();
        if (swapFeeBps_ > TOTAL_BPS) revert InvalidSwapFee(swapFeeBps_);

        swapFeeBps = swapFeeBps_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(OPERATOR_ROLE, operator_);
    }

    /// @notice Pauses swap execution.
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpauses swap execution.
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /// @notice Updates the swap fee applied by the exchange.
    /// @param newSwapFeeBps New swap fee in basis points.
    function setSwapFeeBps(uint16 newSwapFeeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newSwapFeeBps > TOTAL_BPS) revert InvalidSwapFee(newSwapFeeBps);
        swapFeeBps = newSwapFeeBps;
        emit SwapFeeUpdated(msg.sender, newSwapFeeBps);
    }

    /// @notice Sets the normalized price for a mock asset.
    /// @param asset Asset address to price.
    /// @param priceE18 Price normalized to 18 decimals.
    function setAssetPrice(address asset, uint256 priceE18) external onlyRole(OPERATOR_ROLE) {
        if (asset == address(0)) revert ZeroAddress();
        if (priceE18 == 0) revert InvalidPrice(asset);

        _assetPricesE18[asset] = priceE18;
        emit AssetPriceUpdated(msg.sender, asset, priceE18);
    }

    /// @notice Returns the configured price for a mock asset.
    /// @param asset Asset address to query.
    /// @return priceE18 Price normalized to 18 decimals.
    function assetPriceE18(address asset) external view returns (uint256 priceE18) {
        return _assetPricesE18[asset];
    }

    /// @notice Quotes the output amount for a swap using stored mock prices.
    /// @param assetIn Input asset address.
    /// @param assetOut Output asset address.
    /// @param amountIn Exact input amount.
    /// @return amountOut Quoted output amount after fees.
    function quoteOut(address assetIn, address assetOut, uint256 amountIn) public view returns (uint256 amountOut) {
        if (amountIn == 0) revert ZeroAmount();
        if (assetIn == address(0) || assetOut == address(0)) revert ZeroAddress();

        uint256 priceIn = _assetPricesE18[assetIn];
        uint256 priceOut = _assetPricesE18[assetOut];
        if (priceIn == 0) revert MissingAssetPrice(assetIn);
        if (priceOut == 0) revert MissingAssetPrice(assetOut);

        uint256 grossValueE18 = Math.mulDiv(amountIn, priceIn, 1e18);
        uint256 netValueE18 = Math.mulDiv(grossValueE18, TOTAL_BPS - swapFeeBps, TOTAL_BPS);
        return Math.mulDiv(netValueE18, 1e18, priceOut);
    }

    /// @notice Swaps an exact amount of one mock asset into another mock asset.
    /// @param assetIn Input asset address.
    /// @param assetOut Output asset address.
    /// @param amountIn Exact input token amount.
    /// @param minAmountOut Minimum acceptable output amount.
    /// @param recipient Recipient of the output tokens.
    /// @return amountOut Actual output token amount minted to the recipient.
    function swapExactInput(
        address assetIn,
        address assetOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) external whenNotPaused nonReentrant returns (uint256 amountOut) {
        if (recipient == address(0)) revert ZeroAddress();

        amountOut = quoteOut(assetIn, assetOut, amountIn);
        if (amountOut < minAmountOut) revert SlippageExceeded(amountOut, minAmountOut);

        IERC20(assetIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IMintableBurnableERC20(assetIn).burn(address(this), amountIn);
        IMintableBurnableERC20(assetOut).mint(recipient, amountOut);

        emit AssetsSwapped(msg.sender, assetIn, assetOut, amountIn, amountOut, recipient);
    }
}
