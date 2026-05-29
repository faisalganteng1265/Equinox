// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {VenueType} from "../common/Types.sol";
import {BaseMockYieldAdapter} from "./BaseMockYieldAdapter.sol";

/// @title Mock CeFi Earn Adapter
/// @notice Simulated CeFi yield venue used to model off-chain earn allocations.
contract MockCeFiEarnAdapter is BaseMockYieldAdapter {
    /// @notice Deploys the CeFi earn adapter wrapper.
    /// @param asset_ Managed asset address.
    /// @param admin_ Initial admin allowed to manage roles.
    /// @param operator_ Initial operator allowed to update snapshots.
    constructor(address asset_, address admin_, address operator_)
        BaseMockYieldAdapter(asset_, VenueType.CeFiEarn, admin_, operator_)
    {}
}
