// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {VenueType} from "../common/Types.sol";
import {BaseMockYieldAdapter} from "./BaseMockYieldAdapter.sol";

contract MockIdleAdapter is BaseMockYieldAdapter {
    constructor(address asset_, address admin_, address operator_)
        BaseMockYieldAdapter(asset_, VenueType.Idle, admin_, operator_)
    {}
}
