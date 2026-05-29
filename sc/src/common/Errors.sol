// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/// @notice Custom errors reused across the Equinox smart-contract system.
/// @notice A required address input was zero.
error ZeroAddress();
/// @notice A required amount input was zero.
error ZeroAmount();
/// @notice A reasoning hash was empty when one was required.
error EmptyReasoningHash();
/// @notice Parallel array inputs do not have matching lengths.
error InvalidArrayLength();
/// @notice A rebalance target set did not sum to `10_000` basis points.
error InvalidWeightSum(uint256 totalWeightBps);
/// @notice The same asset appeared twice in a configuration payload.
error DuplicateAsset(address asset);
/// @notice The same asset-adapter pair appeared twice in a rebalance payload.
error DuplicateAssetAdapter(address asset, address adapter);
/// @notice A rebalance target carried an invalid weight for the asset-adapter pair.
error InvalidWeightTarget(address asset, address adapter);
/// @notice A swap fee exceeded the supported bounds.
error InvalidSwapFee(uint256 feeBps);
/// @notice Asset risk configuration was malformed.
error InvalidRiskConfig(address asset);
/// @notice Asset price input was invalid or zero.
error InvalidPrice(address asset);
/// @notice Caller was not accepted as an admin for the attempted action.
error InvalidAdmin(address caller);
/// @notice Caller was not accepted as an operator for the attempted action.
error InvalidOperator(address caller);
/// @notice Factory configuration payload was malformed.
error InvalidFactoryConfig();
/// @notice Adapter asset did not match the registry asset being configured.
error InvalidStrategyAsset(address asset, address adapter, address adapterAsset);
/// @notice A required mock price was not configured for the asset.
error MissingAssetPrice(address asset);
/// @notice Asset is not supported by the vault or exchange.
error UnsupportedAsset(address asset);
/// @notice Adapter is not approved for the requested asset.
error UnsupportedAdapter(address asset, address adapter);
/// @notice Swap route is not supported by the mock exchange.
error UnsupportedSwap(address assetIn, address assetOut);
/// @notice The owner already has a vault deployed by the factory.
error VaultAlreadyExists(address owner, address vault);
/// @notice The agent ID is already bound to another vault.
error AgentAlreadyBound(uint256 agentId, address vault);
/// @notice Target exposure breaches the active risk-profile cap.
error RiskProfileViolation(address asset, uint256 attemptedWeightBps, uint256 maxWeightBps);
/// @notice Adapter risk score exceeds the tolerated threshold.
error AdapterRiskScoreTooHigh(address adapter, uint256 attemptedRiskScore, uint256 maxRiskScore);
/// @notice Caller is not the authorized backend agent.
error UnauthorizedAgent(address caller);
/// @notice Caller is not allowed to manage the registry entry.
error UnauthorizedRegistryManager(address caller, uint256 agentId);
/// @notice Agent ID does not exist in the registry.
error UnknownAgent(uint256 agentId);
/// @notice Preview returned a rejected rebalance and includes the offending values.
error RebalancePreviewFailed(
    uint8 reason,
    address offendingAsset,
    address offendingAdapter,
    uint256 attemptedWeightBps,
    uint256 limitWeightBps,
    uint256 totalWeightBps
);
/// @notice A rejection-recording path was called even though preview was valid.
error AlreadyValidRebalance();
/// @notice Actual swap output was below the minimum requested amount.
error SlippageExceeded(uint256 actualAmountOut, uint256 minAmountOut);
/// @notice Account did not hold enough shares for the requested withdrawal.
error InsufficientShares(address account, uint256 availableShares, uint256 requiredShares);
/// @notice Share mint preview resolved to zero.
error ZeroSharesMinted();
