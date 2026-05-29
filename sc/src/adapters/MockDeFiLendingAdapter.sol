// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {VenueType} from "../common/Types.sol";
import {BaseMockYieldAdapter} from "./BaseMockYieldAdapter.sol";

/// @title Mock DeFi Lending Adapter
/// @notice Simulated on-chain lending venue used by the Equinox strategy layer.
contract MockDeFiLendingAdapter is BaseMockYieldAdapter {
    /// @notice Deploys the DeFi lending adapter wrapper.
    /// @param asset_ Managed asset address.
    /// @param admin_ Initial admin allowed to manage roles.
    /// @param operator_ Initial operator allowed to update snapshots.
    constructor(address asset_, address admin_, address operator_)
        BaseMockYieldAdapter(asset_, VenueType.DeFiLending, admin_, operator_)
    {}
}
