// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

interface IMockAssetExchange {
    /// @notice Returns the configured mock price for an asset.
    /// @param asset Asset address to query.
    /// @return priceE18 Asset price normalized to 18 decimals.
    function assetPriceE18(address asset) external view returns (uint256 priceE18);

    /// @notice Quotes how much output asset would be received for an exact input amount.
    /// @param assetIn Input asset address.
    /// @param assetOut Output asset address.
    /// @param amountIn Input token amount.
    /// @return amountOut Quoted output token amount.
    function quoteOut(address assetIn, address assetOut, uint256 amountIn) external view returns (uint256 amountOut);

    /// @notice Swaps an exact amount of one mock asset into another.
    /// @param assetIn Input asset address.
    /// @param assetOut Output asset address.
    /// @param amountIn Exact input token amount.
    /// @param minAmountOut Minimum acceptable output amount.
    /// @param recipient Recipient of the output tokens.
    /// @return amountOut Actual output token amount delivered.
    function swapExactInput(
        address assetIn,
        address assetOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) external returns (uint256 amountOut);
}
