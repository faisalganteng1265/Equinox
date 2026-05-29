// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {VenueType} from "../common/Types.sol";
import {BaseMockYieldAdapter} from "./BaseMockYieldAdapter.sol";

/// @title Mock Idle Adapter
/// @notice Simulated idle venue used for uninvested capital inside the Equinox mock environment.
contract MockIdleAdapter is BaseMockYieldAdapter {
    /// @notice Deploys the idle adapter wrapper.
    /// @param asset_ Managed asset address.
    /// @param admin_ Initial admin allowed to manage roles.
    /// @param operator_ Initial operator allowed to update snapshots.
    constructor(address asset_, address admin_, address operator_)
        BaseMockYieldAdapter(asset_, VenueType.Idle, admin_, operator_)
    {}
}
