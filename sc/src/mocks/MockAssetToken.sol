// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {ZeroAddress} from "../common/Errors.sol";
import {IMintableBurnableERC20} from "../interfaces/IMintableBurnableERC20.sol";

/// @title Equinox Mock Asset Token
/// @notice Role-gated ERC20 used to simulate RWA and yield assets on Mantle testnet.
contract MockAssetToken is ERC20, AccessControl, IMintableBurnableERC20 {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /// @notice Deploys a mock ERC20 asset with mint and burn roles.
    /// @param name_ ERC20 token name.
    /// @param symbol_ ERC20 token symbol.
    /// @param admin_ Initial admin address for role management.
    constructor(string memory name_, string memory symbol_, address admin_) ERC20(name_, symbol_) {
        if (admin_ == address(0)) revert ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(MINTER_ROLE, admin_);
        _grantRole(BURNER_ROLE, admin_);
    }

    /// @notice Mints tokens to a target account.
    /// @param account Recipient of the minted tokens.
    /// @param amount Token amount to mint.
    function mint(address account, uint256 amount) external onlyRole(MINTER_ROLE) {
        if (account == address(0)) revert ZeroAddress();
        _mint(account, amount);
    }

    /// @notice Burns tokens from a target account.
    /// @param account Account whose balance will be burned.
    /// @param amount Token amount to burn.
    function burn(address account, uint256 amount) external onlyRole(BURNER_ROLE) {
        if (account == address(0)) revert ZeroAddress();
        _burn(account, amount);
    }
}
