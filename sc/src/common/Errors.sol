// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

error ZeroAddress();
error ZeroAmount();
error EmptyReasoningHash();
error InvalidArrayLength();
error InvalidWeightSum(uint256 totalWeightBps);
error DuplicateAsset(address asset);
error DuplicateAssetAdapter(address asset, address adapter);
error InvalidWeightTarget(address asset, address adapter);
error InvalidSwapFee(uint256 feeBps);
error InvalidRiskConfig(address asset);
error InvalidPrice(address asset);
error InvalidAdmin(address caller);
error InvalidOperator(address caller);
error InvalidFactoryConfig();
error InvalidStrategyAsset(address asset, address adapter, address adapterAsset);
error MissingAssetPrice(address asset);
error UnsupportedAsset(address asset);
error UnsupportedAdapter(address asset, address adapter);
error UnsupportedSwap(address assetIn, address assetOut);
error VaultAlreadyExists(address owner, address vault);
error AgentAlreadyBound(uint256 agentId, address vault);
error RiskProfileViolation(address asset, uint256 attemptedWeightBps, uint256 maxWeightBps);
error AdapterRiskScoreTooHigh(address adapter, uint256 attemptedRiskScore, uint256 maxRiskScore);
error UnauthorizedAgent(address caller);
error UnauthorizedRegistryManager(address caller, uint256 agentId);
error UnknownAgent(uint256 agentId);
error RebalancePreviewFailed(
    uint8 reason,
    address offendingAsset,
    address offendingAdapter,
    uint256 attemptedWeightBps,
    uint256 limitWeightBps,
    uint256 totalWeightBps
);
error AlreadyValidRebalance();
error SlippageExceeded(uint256 actualAmountOut, uint256 minAmountOut);
error InsufficientShares(address account, uint256 availableShares, uint256 requiredShares);
error ZeroSharesMinted();
