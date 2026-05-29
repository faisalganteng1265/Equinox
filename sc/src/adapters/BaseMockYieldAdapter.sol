// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {InsufficientShares, ZeroAddress, ZeroAmount, ZeroSharesMinted} from "../common/Errors.sol";
import {MarketSnapshot, VenueType} from "../common/Types.sol";
import {IMintableBurnableERC20} from "../interfaces/IMintableBurnableERC20.sol";
import {IStrategyAdapter} from "../interfaces/IStrategyAdapter.sol";

/// @title Base Mock Yield Adapter
/// @notice Shared accounting and yield-accrual logic for simulated Equinox strategy venues.
abstract contract BaseMockYieldAdapter is AccessControl, Pausable, ReentrancyGuard, IStrategyAdapter {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    uint256 private constant TOTAL_BPS = 10_000;
    uint256 private constant YEAR = 365 days;

    IMintableBurnableERC20 private immutable _asset;
    VenueType public immutable venueType;

    mapping(address => uint256) private _shares;
    uint256 public totalShares;
    uint64 public lastAccrualTimestamp;
    MarketSnapshot private _snapshot;

    event SnapshotUpdated(
        address indexed caller,
        uint32 apyBps,
        uint16 riskScore,
        uint16 liquidityScore,
        uint64 sourceTimestamp,
        bytes32 sourceHash
    );
    event YieldSynced(address indexed caller, uint256 accruedAssets);
    event Deposited(address indexed caller, uint256 assets, uint256 sharesMinted);
    event Withdrawn(address indexed caller, address indexed recipient, uint256 assets, uint256 sharesBurned);

    /// @notice Deploys a base mock yield adapter.
    /// @param asset_ Managed asset address.
    /// @param venueType_ Venue classification exposed by the adapter.
    /// @param admin_ Initial admin allowed to pause and manage roles.
    /// @param operator_ Initial operator allowed to update market snapshots.
    constructor(address asset_, VenueType venueType_, address admin_, address operator_) {
        if (asset_ == address(0) || admin_ == address(0) || operator_ == address(0)) revert ZeroAddress();

        _asset = IMintableBurnableERC20(asset_);
        venueType = venueType_;
        lastAccrualTimestamp = uint64(block.timestamp);

        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(OPERATOR_ROLE, operator_);
    }

    /// @notice Pauses deposits, withdrawals, and yield syncing.
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpauses deposits, withdrawals, and yield syncing.
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /// @notice Returns the managed asset address.
    /// @return assetAddress Managed ERC20 asset address.
    function asset() public view returns (address assetAddress) {
        return address(_asset);
    }

    /// @notice Returns the latest market snapshot used by the adapter.
    /// @return snapshot Latest stored market snapshot.
    function latestSnapshot() external view returns (MarketSnapshot memory snapshot) {
        return _snapshot;
    }

    /// @notice Returns total assets currently held by the adapter.
    /// @return assetsUnderManagement Total managed assets.
    function totalManagedAssets() public view returns (uint256 assetsUnderManagement) {
        return IERC20(asset()).balanceOf(address(this));
    }

    /// @notice Returns the adapter share balance for an account.
    /// @param account Share owner to query.
    /// @return shares Adapter share balance.
    function balanceOf(address account) external view returns (uint256 shares) {
        return _shares[account];
    }

    /// @notice Returns the maximum assets an account can currently withdraw.
    /// @param account Share owner to query.
    /// @return assetsOut Maximum withdrawable asset amount.
    function maxWithdraw(address account) public view returns (uint256 assetsOut) {
        if (totalShares == 0) {
            return 0;
        }

        return Math.mulDiv(_shares[account], _totalAssetsWithPendingYield(), totalShares);
    }

    /// @notice Converts shares into the current equivalent asset amount.
    /// @param shares Share amount to convert.
    /// @return assetsOut Equivalent asset amount.
    function convertToAssets(uint256 shares) public view returns (uint256 assetsOut) {
        if (totalShares == 0) {
            return shares;
        }

        return Math.mulDiv(shares, _totalAssetsWithPendingYield(), totalShares);
    }

    /// @notice Previews how many shares would be minted for a deposit.
    /// @param amount Asset amount to deposit.
    /// @return sharesMinted Estimated shares to mint.
    function previewDeposit(uint256 amount) external view returns (uint256 sharesMinted) {
        return _previewDeposit(amount, _totalAssetsWithPendingYield());
    }

    /// @notice Previews how many shares would be burned for a withdrawal.
    /// @param amount Asset amount to withdraw.
    /// @return sharesBurned Estimated shares to burn.
    function previewWithdraw(uint256 amount) external view returns (uint256 sharesBurned) {
        return _previewWithdraw(amount, _totalAssetsWithPendingYield());
    }

    /// @notice Updates the latest market snapshot used for simulated accrual.
    /// @param apyBps Annual percentage yield in basis points.
    /// @param riskScore Adapter risk score used by vault guardrails.
    /// @param liquidityScore Liquidity score exposed to off-chain systems.
    /// @param sourceTimestamp Timestamp from the upstream data source.
    /// @param sourceHash Hash of the off-chain source payload.
    function setMarketSnapshot(
        uint32 apyBps,
        uint16 riskScore,
        uint16 liquidityScore,
        uint64 sourceTimestamp,
        bytes32 sourceHash
    ) external onlyRole(OPERATOR_ROLE) {
        _accrueYield();
        _snapshot = MarketSnapshot({
            apyBps: apyBps,
            riskScore: riskScore,
            liquidityScore: liquidityScore,
            sourceTimestamp: sourceTimestamp,
            sourceHash: sourceHash
        });

        emit SnapshotUpdated(msg.sender, apyBps, riskScore, liquidityScore, sourceTimestamp, sourceHash);
    }

    /// @notice Applies time-based yield accrual using the latest snapshot.
    /// @return accruedAssets Newly accrued asset amount.
    function syncYield() external whenNotPaused returns (uint256 accruedAssets) {
        accruedAssets = _accrueYield();
    }

    /// @notice Deposits assets and mints strategy shares to the caller.
    /// @param amount Asset amount to deposit.
    /// @return sharesMinted Shares minted to the caller.
    function deposit(uint256 amount) external whenNotPaused nonReentrant returns (uint256 sharesMinted) {
        if (amount == 0) revert ZeroAmount();

        _accrueYield();
        uint256 totalAssetsBefore = totalManagedAssets();
        sharesMinted = _previewDeposit(amount, totalAssetsBefore);
        if (sharesMinted == 0) revert ZeroSharesMinted();

        _shares[msg.sender] += sharesMinted;
        totalShares += sharesMinted;

        IERC20(asset()).safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount, sharesMinted);
    }

    /// @notice Withdraws assets from the adapter to a recipient.
    /// @param amount Asset amount to withdraw.
    /// @param recipient Recipient of the withdrawn assets.
    /// @return sharesBurned Shares burned from the caller.
    function withdraw(uint256 amount, address recipient)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 sharesBurned)
    {
        if (recipient == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        _accrueYield();
        uint256 totalAssetsBefore = totalManagedAssets();
        sharesBurned = _previewWithdraw(amount, totalAssetsBefore);
        uint256 availableShares = _shares[msg.sender];
        if (availableShares < sharesBurned) {
            revert InsufficientShares(msg.sender, availableShares, sharesBurned);
        }

        _shares[msg.sender] = availableShares - sharesBurned;
        totalShares -= sharesBurned;

        IERC20(asset()).safeTransfer(recipient, amount);
        emit Withdrawn(msg.sender, recipient, amount, sharesBurned);
    }

    /// @notice Withdraws the caller's full adapter position to a recipient.
    /// @param recipient Recipient of the withdrawn assets.
    /// @return assetsReturned Total assets returned to the recipient.
    function withdrawAll(address recipient) external whenNotPaused nonReentrant returns (uint256 assetsReturned) {
        if (recipient == address(0)) revert ZeroAddress();

        _accrueYield();

        uint256 sharesHeld = _shares[msg.sender];
        if (sharesHeld == 0) {
            return 0;
        }

        assetsReturned = Math.mulDiv(sharesHeld, totalManagedAssets(), totalShares);
        delete _shares[msg.sender];
        totalShares -= sharesHeld;

        IERC20(asset()).safeTransfer(recipient, assetsReturned);
        emit Withdrawn(msg.sender, recipient, assetsReturned, sharesHeld);
    }

    function _previewDeposit(uint256 amount, uint256 totalAssetsBefore) internal view returns (uint256 sharesMinted) {
        if (totalShares == 0 || totalAssetsBefore == 0) {
            return amount;
        }

        return Math.mulDiv(amount, totalShares, totalAssetsBefore);
    }

    function _previewWithdraw(uint256 amount, uint256 totalAssetsBefore) internal view returns (uint256 sharesBurned) {
        if (totalShares == 0 || totalAssetsBefore == 0) {
            return amount;
        }

        return Math.mulDiv(amount, totalShares, totalAssetsBefore, Math.Rounding.Up);
    }

    function _accrueYield() internal returns (uint256 accruedAssets) {
        uint256 pendingYield = _pendingYield(totalManagedAssets());
        lastAccrualTimestamp = uint64(block.timestamp);

        if (pendingYield > 0) {
            _asset.mint(address(this), pendingYield);
            emit YieldSynced(msg.sender, pendingYield);
        }

        return pendingYield;
    }

    function _totalAssetsWithPendingYield() internal view returns (uint256 totalAssetsWithYield) {
        uint256 currentAssets = totalManagedAssets();
        return currentAssets + _pendingYield(currentAssets);
    }

    function _pendingYield(uint256 principal) internal view returns (uint256 accruedAssets) {
        if (principal == 0 || _snapshot.apyBps == 0 || block.timestamp <= lastAccrualTimestamp) {
            return 0;
        }

        uint256 elapsed = block.timestamp - lastAccrualTimestamp;
        return Math.mulDiv(principal, uint256(_snapshot.apyBps) * elapsed, TOTAL_BPS * YEAR);
    }
}
