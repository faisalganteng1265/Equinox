// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {MarketSnapshot, VenueType} from "../common/Types.sol";

interface IStrategyAdapter {
    /// @notice Returns the asset managed by the adapter.
    /// @return assetAddress Managed ERC20 asset address.
    function asset() external view returns (address);

    /// @notice Returns the venue category implemented by the adapter.
    /// @return venue Adapter venue classification.
    function venueType() external view returns (VenueType);

    /// @notice Returns the total assets currently managed by the adapter.
    /// @return assetsUnderManagement Total managed asset balance.
    function totalManagedAssets() external view returns (uint256);

    /// @notice Returns the share balance held by an account.
    /// @param account Share owner to query.
    /// @return shares Adapter share balance.
    function balanceOf(address account) external view returns (uint256);

    /// @notice Returns the maximum assets an account can currently withdraw.
    /// @param account Share owner to query.
    /// @return assetsOut Maximum withdrawable asset amount.
    function maxWithdraw(address account) external view returns (uint256);

    /// @notice Converts a share amount into assets using the current adapter state.
    /// @param shares Share amount to convert.
    /// @return assetsOut Equivalent asset amount.
    function convertToAssets(uint256 shares) external view returns (uint256);

    /// @notice Previews how many shares would be minted for a deposit.
    /// @param amount Asset amount to deposit.
    /// @return sharesMinted Estimated shares to mint.
    function previewDeposit(uint256 amount) external view returns (uint256);

    /// @notice Previews how many shares would be burned for a withdrawal.
    /// @param amount Asset amount to withdraw.
    /// @return sharesBurned Estimated shares to burn.
    function previewWithdraw(uint256 amount) external view returns (uint256);

    /// @notice Returns the latest market snapshot used by the adapter.
    /// @return snapshot Latest stored APY and risk snapshot.
    function latestSnapshot() external view returns (MarketSnapshot memory);

    /// @notice Deposits assets into the adapter and mints shares to the caller.
    /// @param amount Asset amount to deposit.
    /// @return sharesMinted Shares minted to the caller.
    function deposit(uint256 amount) external returns (uint256 sharesMinted);

    /// @notice Withdraws assets from the adapter to a recipient.
    /// @param amount Asset amount to withdraw.
    /// @param recipient Recipient receiving withdrawn assets.
    /// @return sharesBurned Shares burned from the caller.
    function withdraw(uint256 amount, address recipient) external returns (uint256 sharesBurned);

    /// @notice Withdraws the caller's full position to a recipient.
    /// @param recipient Recipient receiving all withdrawn assets.
    /// @return assetsReturned Total assets returned to the recipient.
    function withdrawAll(address recipient) external returns (uint256 assetsReturned);

    /// @notice Applies time-based yield accrual using the latest market snapshot.
    /// @return accruedAssets Newly accrued asset amount minted into the adapter.
    function syncYield() external returns (uint256 accruedAssets);
}
