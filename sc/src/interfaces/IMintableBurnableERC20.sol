// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMintableBurnableERC20 is IERC20 {
    /// @notice Mints tokens to a target account.
    /// @param account Recipient of the minted tokens.
    /// @param amount Token amount to mint.
    function mint(address account, uint256 amount) external;

    /// @notice Burns tokens from a target account.
    /// @param account Account whose balance will be burned.
    /// @param amount Token amount to burn.
    function burn(address account, uint256 amount) external;
}
