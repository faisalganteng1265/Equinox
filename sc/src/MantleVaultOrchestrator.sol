// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {
    AdapterRiskScoreTooHigh,
    DuplicateAssetAdapter,
    EmptyReasoningHash,
    InvalidArrayLength,
    InvalidRiskConfig,
    MissingAssetPrice,
    RebalancePreviewFailed,
    UnauthorizedAgent,
    UnknownAgent,
    UnsupportedAdapter,
    UnsupportedAsset,
    ZeroAddress,
    ZeroAmount
} from "./common/Errors.sol";
import {
    AssetPolicy,
    MarketSnapshot,
    PreviewResult,
    RebalanceRejectionReason,
    RiskProfile,
    StrategyTarget
} from "./common/Types.sol";
import {IMantleAgentRegistry8004} from "./interfaces/IMantleAgentRegistry8004.sol";
import {IMockAssetExchange} from "./interfaces/IMockAssetExchange.sol";
import {IStrategyAdapter} from "./interfaces/IStrategyAdapter.sol";
import {IStrategyRegistry} from "./interfaces/IStrategyRegistry.sol";

contract MantleVaultOrchestrator is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint16 public constant TOTAL_BPS = 10_000;

    IMantleAgentRegistry8004 public immutable agentRegistry;
    IMockAssetExchange public immutable assetExchange;
    IStrategyRegistry public immutable strategyRegistry;
    uint256 public immutable agentId;

    address public authorizedAgent;
    RiskProfile public currentRiskProfile;

    address[] private _trackedAssets;
    mapping(address => bool) private _knownAssets;
    mapping(address => AssetPolicy) private _assetPolicies;
    mapping(address => uint16) private _assetTargetWeights;
    mapping(address => mapping(address => uint16)) private _strategyTargetWeights;

    event AuthorizedAgentUpdated(address indexed previousAgent, address indexed newAgent);
    event RiskProfileUpdated(address indexed caller, RiskProfile previousProfile, RiskProfile newProfile);
    event VaultPaused(address indexed caller);
    event VaultUnpaused(address indexed caller);
    event DepositRecorded(address indexed asset, address indexed owner, uint256 amount);
    event WithdrawalExecuted(address indexed asset, address indexed recipient, uint256 amount);
    event AssetPolicyConfigured(
        address indexed asset,
        uint8 riskTier,
        uint16 conservativeMaxBps,
        uint16 balancedMaxBps,
        uint16 aggressiveMaxBps,
        bool enabled
    );
    event RebalanceRejected(
        address indexed executor,
        bytes32 reasoningHash,
        string detailsURI,
        RebalanceRejectionReason reason,
        address offendingAsset,
        address offendingAdapter
    );
    event PortfolioRebalanced(
        address indexed executor,
        bytes32 reasoningHash,
        string detailsURI,
        uint256 totalPortfolioValueE18,
        StrategyTarget[] targets
    );

    /// @notice Deploys a single-user Equinox vault with approved assets and strategy infrastructure.
    /// @param owner_ Vault owner address.
    /// @param authorizedAgent_ Backend agent allowed to preview and execute rebalances.
    /// @param agentRegistry_ Agent registry used for identity verification and decision logging.
    /// @param strategyRegistry_ Registry of approved strategy adapters per asset.
    /// @param assetExchange_ Mock exchange used for cross-asset swaps.
    /// @param agentId_ Registered agent identifier bound to the vault.
    /// @param initialRiskProfile_ Initial risk profile enforced by the vault.
    /// @param assets_ Supported asset addresses.
    /// @param riskTiers_ Risk tiers aligned with `assets_`.
    /// @param maxAllocationBps_ Max allocation caps per risk profile aligned with `assets_`.
    constructor(
        address owner_,
        address authorizedAgent_,
        IMantleAgentRegistry8004 agentRegistry_,
        IStrategyRegistry strategyRegistry_,
        IMockAssetExchange assetExchange_,
        uint256 agentId_,
        RiskProfile initialRiskProfile_,
        address[] memory assets_,
        uint8[] memory riskTiers_,
        uint16[3][] memory maxAllocationBps_
    ) {
        if (
            owner_ == address(0) || authorizedAgent_ == address(0) || address(agentRegistry_) == address(0)
                || address(strategyRegistry_) == address(0) || address(assetExchange_) == address(0)
        ) revert ZeroAddress();
        if (assets_.length == 0 || assets_.length != riskTiers_.length || assets_.length != maxAllocationBps_.length) {
            revert InvalidArrayLength();
        }
        if (!agentRegistry_.exists(agentId_)) revert UnknownAgent(agentId_);

        agentRegistry = agentRegistry_;
        strategyRegistry = strategyRegistry_;
        assetExchange = assetExchange_;
        agentId = agentId_;
        authorizedAgent = authorizedAgent_;
        currentRiskProfile = initialRiskProfile_;

        _transferOwnership(owner_);

        for (uint256 i = 0; i < assets_.length; i++) {
            _configureAssetPolicy(assets_[i], riskTiers_[i], maxAllocationBps_[i], true);
        }
    }

    /// @notice Pauses vault deposits, withdrawals, previews, and rebalance execution.
    function pause() external onlyOwner {
        _pause();
        emit VaultPaused(msg.sender);
    }

    /// @notice Unpauses vault deposits, withdrawals, previews, and rebalance execution.
    function unpause() external onlyOwner {
        _unpause();
        emit VaultUnpaused(msg.sender);
    }

    /// @notice Updates the backend agent allowed to manage rebalances.
    /// @param newAuthorizedAgent New backend agent address.
    function setAuthorizedAgent(address newAuthorizedAgent) external onlyOwner {
        if (newAuthorizedAgent == address(0)) revert ZeroAddress();

        address previousAgent = authorizedAgent;
        authorizedAgent = newAuthorizedAgent;
        emit AuthorizedAgentUpdated(previousAgent, newAuthorizedAgent);
    }

    /// @notice Updates the active risk profile for the vault.
    /// @param newRiskProfile New risk profile to enforce.
    function setRiskProfile(RiskProfile newRiskProfile) external onlyOwner {
        RiskProfile previousProfile = currentRiskProfile;
        currentRiskProfile = newRiskProfile;
        emit RiskProfileUpdated(msg.sender, previousProfile, newRiskProfile);
    }

    /// @notice Configures policy caps for a supported asset.
    /// @param asset Asset address to configure.
    /// @param riskTier Risk tier label used by off-chain systems.
    /// @param maxAllocationBps Max allocation caps for Conservative, Balanced, and Aggressive profiles.
    /// @param enabled Whether the asset can be used by the vault.
    function configureAssetPolicy(address asset, uint8 riskTier, uint16[3] calldata maxAllocationBps, bool enabled)
        external
        onlyOwner
    {
        _configureAssetPolicy(asset, riskTier, maxAllocationBps, enabled);
    }

    /// @notice Returns the list of tracked assets supported by the vault.
    /// @return assets Array of supported asset addresses.
    function getTrackedAssets() external view returns (address[] memory assets) {
        return _trackedAssets;
    }

    /// @notice Returns the current policy configuration for an asset.
    /// @param asset Asset address to query.
    /// @return policy Stored asset policy.
    function getAssetPolicy(address asset) external view returns (AssetPolicy memory policy) {
        return _assetPolicies[asset];
    }

    /// @notice Returns the current target weight stored for an asset.
    /// @param asset Asset address to query.
    /// @return weightBps Current asset target weight in basis points.
    function getAssetTargetWeight(address asset) external view returns (uint16 weightBps) {
        return _assetTargetWeights[asset];
    }

    /// @notice Returns the current target weight stored for a specific asset-adapter pair.
    /// @param asset Asset address to query.
    /// @param adapter Adapter address to query.
    /// @return weightBps Current strategy target weight in basis points.
    function getStrategyTargetWeight(address asset, address adapter) external view returns (uint16 weightBps) {
        return _strategyTargetWeights[asset][adapter];
    }

    /// @notice Returns total current exposure for an asset across idle balance and strategies.
    /// @param asset Asset address to query.
    /// @return exposure Total asset exposure held by the vault.
    function getCurrentAssetExposure(address asset) public view returns (uint256 exposure) {
        _requireSupportedAsset(asset);

        exposure = IERC20(asset).balanceOf(address(this));
        address[] memory strategies = strategyRegistry.getStrategies(asset);
        for (uint256 i = 0; i < strategies.length; i++) {
            exposure += IStrategyAdapter(strategies[i]).maxWithdraw(address(this));
        }
    }

    /// @notice Returns the total mark-to-market portfolio value using mock exchange prices.
    /// @return totalValueE18 Total portfolio value normalized to 18 decimals.
    function totalPortfolioValueE18() public view returns (uint256 totalValueE18) {
        for (uint256 i = 0; i < _trackedAssets.length; i++) {
            address asset = _trackedAssets[i];
            uint256 priceE18 = assetExchange.assetPriceE18(asset);
            if (priceE18 == 0) revert MissingAssetPrice(asset);

            totalValueE18 += Math.mulDiv(getCurrentAssetExposure(asset), priceE18, 1e18);
        }
    }

    /// @notice Deposits a supported asset into the vault.
    /// @param asset Supported asset address.
    /// @param amount Asset amount to deposit.
    function deposit(address asset, uint256 amount) external onlyOwner whenNotPaused nonReentrant {
        _requireSupportedAsset(asset);
        if (amount == 0) revert ZeroAmount();

        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        emit DepositRecorded(asset, msg.sender, amount);
    }

    /// @notice Withdraws a supported asset from the vault, pulling from strategies when needed.
    /// @param asset Supported asset address.
    /// @param amount Asset amount to withdraw.
    /// @param recipient Recipient receiving the withdrawn assets.
    function withdraw(address asset, uint256 amount, address recipient) external onlyOwner whenNotPaused nonReentrant {
        _requireSupportedAsset(asset);
        if (recipient == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        _pullAssetFromStrategies(asset, amount);
        IERC20(asset).safeTransfer(recipient, amount);
        emit WithdrawalExecuted(asset, recipient, amount);
    }

    /// @notice Previews whether a rebalance request satisfies all vault guardrails.
    /// @param targets Proposed strategy targets.
    /// @return result Structured preview result describing acceptance or rejection.
    function previewRebalance(StrategyTarget[] calldata targets) public view returns (PreviewResult memory result) {
        return _previewRebalance(targets);
    }

    /// @notice Records a rejected rebalance attempt on-chain without moving funds.
    /// @param targets Proposed strategy targets that failed validation.
    /// @param reasoningHash Hash of the off-chain reasoning payload.
    /// @param detailsURI Optional URI with the full reasoning context.
    function recordRejectedDecision(
        StrategyTarget[] calldata targets,
        bytes32 reasoningHash,
        string calldata detailsURI
    ) external whenNotPaused {
        if (msg.sender != authorizedAgent) revert UnauthorizedAgent(msg.sender);
        if (reasoningHash == bytes32(0)) revert EmptyReasoningHash();

        PreviewResult memory preview = _previewRebalance(targets);
        if (preview.ok) revert RebalancePreviewFailed(0, address(0), address(0), 0, 0, 0);

        agentRegistry.logDecision(agentId, reasoningHash, 0, true, detailsURI);
        emit RebalanceRejected(
            msg.sender, reasoningHash, detailsURI, preview.reason, preview.offendingAsset, preview.offendingAdapter
        );
    }

    /// @notice Executes a validated rebalance across assets and approved strategies.
    /// @param targets Approved strategy targets whose weights sum to 10,000 bps.
    /// @param reasoningHash Hash of the off-chain reasoning payload.
    /// @param detailsURI Optional URI with the full reasoning context.
    function executeRebalance(StrategyTarget[] calldata targets, bytes32 reasoningHash, string calldata detailsURI)
        external
        whenNotPaused
        nonReentrant
    {
        if (msg.sender != authorizedAgent) revert UnauthorizedAgent(msg.sender);
        if (reasoningHash == bytes32(0)) revert EmptyReasoningHash();

        PreviewResult memory preview = _previewRebalance(targets);
        if (!preview.ok) {
            revert RebalancePreviewFailed(
                uint8(preview.reason),
                preview.offendingAsset,
                preview.offendingAdapter,
                preview.attemptedWeightBps,
                preview.limitWeightBps,
                preview.totalWeightBps
            );
        }

        _syncAllStrategies();
        _withdrawAllStrategies();

        uint16[] memory aggregatedWeights = _aggregateAssetWeights(targets);
        uint256 portfolioValue = _idlePortfolioValueE18();

        _rebalanceAcrossAssets(aggregatedWeights, portfolioValue);
        _deployIntoStrategies(targets, aggregatedWeights);
        _resetTargetWeights();
        _storeTargetWeights(targets, aggregatedWeights);

        agentRegistry.logDecision(agentId, reasoningHash, 0, false, detailsURI);
        emit PortfolioRebalanced(msg.sender, reasoningHash, detailsURI, totalPortfolioValueE18(), targets);
    }

    function _configureAssetPolicy(address asset, uint8 riskTier, uint16[3] memory maxAllocationBps, bool enabled)
        internal
    {
        if (asset == address(0)) revert ZeroAddress();

        for (uint256 i = 0; i < maxAllocationBps.length; i++) {
            if (maxAllocationBps[i] > TOTAL_BPS) revert InvalidRiskConfig(asset);
        }

        if (!_knownAssets[asset]) {
            _knownAssets[asset] = true;
            _trackedAssets.push(asset);
        }

        _assetPolicies[asset] = AssetPolicy({enabled: enabled, riskTier: riskTier, maxAllocationBps: maxAllocationBps});
        emit AssetPolicyConfigured(
            asset, riskTier, maxAllocationBps[0], maxAllocationBps[1], maxAllocationBps[2], enabled
        );
    }

    function _requireSupportedAsset(address asset) internal view {
        if (!_assetPolicies[asset].enabled) revert UnsupportedAsset(asset);
    }

    function _previewRebalance(StrategyTarget[] calldata targets) internal view returns (PreviewResult memory result) {
        if (targets.length == 0) {
            return PreviewResult({
                ok: false,
                reason: RebalanceRejectionReason.EmptyTargets,
                offendingAsset: address(0),
                offendingAdapter: address(0),
                attemptedWeightBps: 0,
                limitWeightBps: 0,
                totalWeightBps: 0
            });
        }

        uint16[] memory assetWeights = new uint16[](_trackedAssets.length);
        uint16 adapterRiskLimit = _maxAdapterRiskScore(currentRiskProfile);
        uint16 totalWeight;

        for (uint256 i = 0; i < targets.length; i++) {
            StrategyTarget calldata target = targets[i];

            if (!_assetPolicies[target.asset].enabled) {
                return
                    PreviewResult(
                        false, RebalanceRejectionReason.UnsupportedAsset, target.asset, target.adapter, 0, 0, 0
                    );
            }
            if (!strategyRegistry.isStrategyApproved(target.asset, target.adapter)) {
                return PreviewResult(
                    false, RebalanceRejectionReason.UnapprovedAdapter, target.asset, target.adapter, 0, 0, totalWeight
                );
            }

            for (uint256 j = i + 1; j < targets.length; j++) {
                if (targets[j].asset == target.asset && targets[j].adapter == target.adapter) {
                    return PreviewResult(
                        false,
                        RebalanceRejectionReason.DuplicateTarget,
                        target.asset,
                        target.adapter,
                        target.weightBps,
                        target.weightBps,
                        totalWeight
                    );
                }
            }

            MarketSnapshot memory snapshot = IStrategyAdapter(target.adapter).latestSnapshot();
            if (snapshot.riskScore > adapterRiskLimit) {
                return PreviewResult(
                    false,
                    RebalanceRejectionReason.AdapterRiskTooHigh,
                    target.asset,
                    target.adapter,
                    snapshot.riskScore,
                    adapterRiskLimit,
                    totalWeight
                );
            }

            if (assetExchange.assetPriceE18(target.asset) == 0) {
                return PreviewResult(
                    false, RebalanceRejectionReason.MissingPrice, target.asset, target.adapter, 0, 0, totalWeight
                );
            }

            uint256 assetIndex = _assetIndex(target.asset);
            assetWeights[assetIndex] += target.weightBps;
            uint16 limitWeight = _assetPolicies[target.asset].maxAllocationBps[uint8(currentRiskProfile)];
            if (assetWeights[assetIndex] > limitWeight) {
                return PreviewResult(
                    false,
                    RebalanceRejectionReason.AssetRiskLimitExceeded,
                    target.asset,
                    target.adapter,
                    assetWeights[assetIndex],
                    limitWeight,
                    totalWeight
                );
            }

            totalWeight += target.weightBps;
        }

        if (totalWeight != TOTAL_BPS) {
            return PreviewResult(
                false,
                RebalanceRejectionReason.WeightSumMismatch,
                address(0),
                address(0),
                totalWeight,
                TOTAL_BPS,
                totalWeight
            );
        }

        for (uint256 i = 0; i < _trackedAssets.length; i++) {
            if (getCurrentAssetExposure(_trackedAssets[i]) > 0 && assetExchange.assetPriceE18(_trackedAssets[i]) == 0) {
                return PreviewResult(
                    false, RebalanceRejectionReason.MissingPrice, _trackedAssets[i], address(0), 0, 0, totalWeight
                );
            }
        }

        return PreviewResult(true, RebalanceRejectionReason.None, address(0), address(0), 0, 0, totalWeight);
    }

    function _aggregateAssetWeights(StrategyTarget[] calldata targets)
        internal
        view
        returns (uint16[] memory assetWeights)
    {
        assetWeights = new uint16[](_trackedAssets.length);
        for (uint256 i = 0; i < targets.length; i++) {
            uint256 assetIndex = _assetIndex(targets[i].asset);
            assetWeights[assetIndex] += targets[i].weightBps;
        }
    }

    function _resetTargetWeights() internal {
        for (uint256 i = 0; i < _trackedAssets.length; i++) {
            address asset = _trackedAssets[i];
            _assetTargetWeights[asset] = 0;

            address[] memory strategies = strategyRegistry.getStrategies(asset);
            for (uint256 j = 0; j < strategies.length; j++) {
                _strategyTargetWeights[asset][strategies[j]] = 0;
            }
        }
    }

    function _storeTargetWeights(StrategyTarget[] calldata targets, uint16[] memory aggregatedWeights) internal {
        for (uint256 i = 0; i < _trackedAssets.length; i++) {
            _assetTargetWeights[_trackedAssets[i]] = aggregatedWeights[i];
        }

        for (uint256 i = 0; i < targets.length; i++) {
            _strategyTargetWeights[targets[i].asset][targets[i].adapter] = targets[i].weightBps;
        }
    }

    function _syncAllStrategies() internal {
        for (uint256 i = 0; i < _trackedAssets.length; i++) {
            address[] memory strategies = strategyRegistry.getStrategies(_trackedAssets[i]);
            for (uint256 j = 0; j < strategies.length; j++) {
                IStrategyAdapter(strategies[j]).syncYield();
            }
        }
    }

    function _withdrawAllStrategies() internal {
        for (uint256 i = 0; i < _trackedAssets.length; i++) {
            address[] memory strategies = strategyRegistry.getStrategies(_trackedAssets[i]);
            for (uint256 j = 0; j < strategies.length; j++) {
                IStrategyAdapter strategy = IStrategyAdapter(strategies[j]);
                if (strategy.balanceOf(address(this)) > 0) {
                    strategy.withdrawAll(address(this));
                }
            }
        }
    }

    function _pullAssetFromStrategies(address asset, uint256 requiredAmount) internal {
        uint256 idleBalance = IERC20(asset).balanceOf(address(this));
        if (idleBalance >= requiredAmount) {
            return;
        }

        uint256 shortfall = requiredAmount - idleBalance;
        address[] memory strategies = strategyRegistry.getStrategies(asset);

        for (uint256 i = 0; i < strategies.length && shortfall > 0; i++) {
            IStrategyAdapter strategy = IStrategyAdapter(strategies[i]);
            uint256 available = strategy.maxWithdraw(address(this));
            if (available == 0) {
                continue;
            }

            uint256 amountToWithdraw = available > shortfall ? shortfall : available;
            strategy.withdraw(amountToWithdraw, address(this));
            shortfall -= amountToWithdraw;
        }
    }

    function _idlePortfolioValueE18() internal view returns (uint256 totalValueE18) {
        for (uint256 i = 0; i < _trackedAssets.length; i++) {
            address asset = _trackedAssets[i];
            uint256 priceE18 = assetExchange.assetPriceE18(asset);
            if (priceE18 == 0) revert MissingAssetPrice(asset);

            totalValueE18 += Math.mulDiv(IERC20(asset).balanceOf(address(this)), priceE18, 1e18);
        }
    }

    function _rebalanceAcrossAssets(uint16[] memory aggregatedWeights, uint256 portfolioValueE18) internal {
        uint256[] memory desiredValues = new uint256[](_trackedAssets.length);
        for (uint256 i = 0; i < _trackedAssets.length; i++) {
            desiredValues[i] = Math.mulDiv(portfolioValueE18, aggregatedWeights[i], TOTAL_BPS);
        }

        for (uint256 i = 0; i < _trackedAssets.length; i++) {
            address sourceAsset = _trackedAssets[i];
            uint256 sourcePrice = assetExchange.assetPriceE18(sourceAsset);
            uint256 sourceBalance = IERC20(sourceAsset).balanceOf(address(this));
            uint256 sourceValue = Math.mulDiv(sourceBalance, sourcePrice, 1e18);

            if (sourceValue <= desiredValues[i]) {
                continue;
            }

            uint256 surplusValue = sourceValue - desiredValues[i];
            for (uint256 j = 0; j < _trackedAssets.length && surplusValue > 0; j++) {
                if (i == j) {
                    continue;
                }

                address targetAsset = _trackedAssets[j];
                uint256 targetPrice = assetExchange.assetPriceE18(targetAsset);
                uint256 targetBalance = IERC20(targetAsset).balanceOf(address(this));
                uint256 targetValue = Math.mulDiv(targetBalance, targetPrice, 1e18);

                if (targetValue >= desiredValues[j]) {
                    continue;
                }

                uint256 deficitValue = desiredValues[j] - targetValue;
                uint256 tradeValue = surplusValue < deficitValue ? surplusValue : deficitValue;
                uint256 amountIn = Math.mulDiv(tradeValue, 1e18, sourcePrice);
                if (amountIn == 0) {
                    continue;
                }

                IERC20(sourceAsset).forceApprove(address(assetExchange), amountIn);
                assetExchange.swapExactInput(sourceAsset, targetAsset, amountIn, 0, address(this));
                surplusValue -= tradeValue;
            }
        }
    }

    function _deployIntoStrategies(StrategyTarget[] calldata targets, uint16[] memory aggregatedWeights) internal {
        for (uint256 i = 0; i < _trackedAssets.length; i++) {
            address asset = _trackedAssets[i];
            uint16 assetWeight = aggregatedWeights[i];
            if (assetWeight == 0) {
                continue;
            }

            uint256 assetBalance = IERC20(asset).balanceOf(address(this));
            uint256 remainingBalance = assetBalance;
            uint16 remainingWeight = assetWeight;

            for (uint256 j = 0; j < targets.length; j++) {
                if (targets[j].asset != asset) {
                    continue;
                }

                uint256 amountToDeposit = remainingWeight == targets[j].weightBps
                    ? remainingBalance
                    : Math.mulDiv(assetBalance, targets[j].weightBps, assetWeight);

                if (amountToDeposit > 0) {
                    IERC20(asset).forceApprove(targets[j].adapter, amountToDeposit);
                    IStrategyAdapter(targets[j].adapter).deposit(amountToDeposit);
                    remainingBalance -= amountToDeposit;
                }

                remainingWeight -= targets[j].weightBps;
            }
        }
    }

    function _assetIndex(address asset) internal view returns (uint256 index) {
        for (uint256 i = 0; i < _trackedAssets.length; i++) {
            if (_trackedAssets[i] == asset) {
                return i;
            }
        }

        revert UnsupportedAsset(asset);
    }

    function _maxAdapterRiskScore(RiskProfile profile) internal pure returns (uint16) {
        if (profile == RiskProfile.Conservative) {
            return 40;
        }
        if (profile == RiskProfile.Balanced) {
            return 70;
        }
        return 100;
    }
}
