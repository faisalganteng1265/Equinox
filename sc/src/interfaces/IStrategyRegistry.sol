// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

interface IStrategyRegistry {
    /// @notice Returns whether an adapter is approved for an asset.
    /// @param asset Asset address to query.
    /// @param adapter Strategy adapter address to check.
    /// @return approved True when the adapter is registered for the asset.
    function isStrategyApproved(address asset, address adapter) external view returns (bool);

    /// @notice Returns all approved adapters for an asset.
    /// @param asset Asset address to query.
    /// @return strategies List of approved adapter addresses.
    function getStrategies(address asset) external view returns (address[] memory strategies);
}
