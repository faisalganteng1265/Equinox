// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {InvalidStrategyAsset, ZeroAddress} from "./common/Errors.sol";
import {IStrategyAdapter} from "./interfaces/IStrategyAdapter.sol";
import {IStrategyRegistry} from "./interfaces/IStrategyRegistry.sol";

/// @title Equinox Strategy Registry
/// @notice Access-controlled registry that approves strategy adapters per supported asset.
contract StrategyRegistry is AccessControl, IStrategyRegistry {
    using EnumerableSet for EnumerableSet.AddressSet;

    mapping(address => EnumerableSet.AddressSet) private _strategiesByAsset;
    mapping(address => mapping(address => bool)) private _approvedStrategies;

    event StrategyRegistered(address indexed asset, address indexed adapter);
    event StrategyRemoved(address indexed asset, address indexed adapter);

    /// @notice Deploys the strategy registry.
    /// @param admin_ Initial admin allowed to register and remove strategies.
    constructor(address admin_) {
        if (admin_ == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
    }

    /// @notice Registers an approved adapter for a specific asset.
    /// @param asset Asset address the adapter must manage.
    /// @param adapter Adapter address being approved.
    function registerStrategy(address asset, address adapter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (asset == address(0) || adapter == address(0)) revert ZeroAddress();

        address adapterAsset = IStrategyAdapter(adapter).asset();
        if (adapterAsset != asset) {
            revert InvalidStrategyAsset(asset, adapter, adapterAsset);
        }

        if (_strategiesByAsset[asset].add(adapter)) {
            _approvedStrategies[asset][adapter] = true;
            emit StrategyRegistered(asset, adapter);
        }
    }

    /// @notice Removes an approved adapter from an asset.
    /// @param asset Asset address to update.
    /// @param adapter Adapter address being removed.
    function removeStrategy(address asset, address adapter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_strategiesByAsset[asset].remove(adapter)) {
            _approvedStrategies[asset][adapter] = false;
            emit StrategyRemoved(asset, adapter);
        }
    }

    /// @notice Returns whether an adapter is approved for an asset.
    /// @param asset Asset address to query.
    /// @param adapter Adapter address to check.
    /// @return approved True when the adapter is approved.
    function isStrategyApproved(address asset, address adapter) external view returns (bool approved) {
        return _approvedStrategies[asset][adapter];
    }

    /// @notice Returns all approved strategies for an asset.
    /// @param asset Asset address to query.
    /// @return strategies Array of approved adapter addresses.
    function getStrategies(address asset) external view returns (address[] memory strategies) {
        return _strategiesByAsset[asset].values();
    }
}
