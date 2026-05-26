// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {VenueType} from "../common/Types.sol";
import {BaseMockYieldAdapter} from "./BaseMockYieldAdapter.sol";

contract MockCeFiEarnAdapter is BaseMockYieldAdapter {
    constructor(address asset_, address admin_, address operator_)
        BaseMockYieldAdapter(asset_, VenueType.CeFiEarn, admin_, operator_)
    {}
}
