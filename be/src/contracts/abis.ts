import { parseAbi } from "viem";

// Backend intentionally vendors the ABI surface it uses instead of importing
// Foundry artifacts from `sc/out`. This keeps BE boot stable even when the
// local smart-contract artifact folder is missing, stale, or generated on a
// different machine.

export const vaultAbi = parseAbi([
  "function owner() view returns (address)",
  "function authorizedAgent() view returns (address)",
  "function currentRiskProfile() view returns (uint8)",
  "function paused() view returns (bool)",
  "function totalPortfolioValueE18() view returns (uint256)",
  "function getTrackedAssets() view returns (address[])",
  "function agentId() view returns (uint256)",
  "function getAssetPolicy(address asset) view returns ((bool enabled,uint8 riskTier,uint16[3] maxAllocationBps))",
  "function getAssetTargetWeight(address asset) view returns (uint16 weightBps)",
  "function getCurrentAssetExposure(address asset) view returns (uint256 exposure)",
  "function getStrategyTargetWeight(address asset,address adapter) view returns (uint16 weightBps)",
  "function previewRebalance((address asset,address adapter,uint16 weightBps)[] targets) view returns ((bool ok,uint8 reason,address offendingAsset,address offendingAdapter,uint16 attemptedWeightBps,uint16 limitWeightBps,uint16 totalWeightBps))",
  "function executeRebalance((address asset,address adapter,uint16 weightBps)[] targets,bytes32 reasoningHash,string detailsURI)",
  "function recordRejectedDecision((address asset,address adapter,uint16 weightBps)[] targets,bytes32 reasoningHash,string detailsURI)",
]);

export const vaultFactoryAbi = parseAbi([
  "function vaultOfOwner(address owner) view returns (address vault)",
  "function agentOfVault(address vault) view returns (uint256 agentId)",
  "function allVaults() view returns (address[] vaults)",
  "function createVaultFor(address vaultOwner,string agentURI) returns (address vault,uint256 agentId)",
]);

export const agentRegistryAbi = parseAbi([
  "function exists(uint256 agentId) view returns (bool registered)",
  "function getAgentStats(uint256 agentId) view returns ((uint64 totalDecisions,uint64 successfulDecisions,uint64 blockedDecisions,uint64 lastDecisionAt,int256 cumulativePerformanceBps,uint16 reputationScore))",
  "function getDecisionCount(uint256 agentId) view returns (uint256 count)",
  "function getDecision(uint256 agentId,uint256 index) view returns ((bytes32 reasoningHash,int256 performanceBps,uint64 timestamp,bool blockedByGuardrail,string detailsURI))",
]);

export const strategyRegistryAbi = parseAbi([
  "function isStrategyApproved(address asset,address adapter) view returns (bool approved)",
  "function getStrategies(address asset) view returns (address[] strategies)",
]);

export const exchangeAbi = parseAbi([
  "function assetPriceE18(address asset) view returns (uint256 priceE18)",
  "function setAssetPrice(address asset,uint256 priceE18)",
]);

export const tokenAbi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function mint(address to,uint256 amount)",
]);

export const strategyAdapterAbi = parseAbi([
  "function venueType() view returns (uint8)",
  "function totalManagedAssets() view returns (uint256)",
  "function maxWithdraw(address account) view returns (uint256 assetsOut)",
  "function balanceOf(address account) view returns (uint256 shares)",
  "function latestSnapshot() view returns ((uint32 apyBps,uint16 riskScore,uint16 liquidityScore,uint64 sourceTimestamp,bytes32 sourceHash))",
]);

export const baseAdapterAbi = parseAbi([
  "function setMarketSnapshot(uint32 apyBps,uint16 riskScore,uint16 liquidityScore,uint64 sourceTimestamp,bytes32 sourceHash)",
]);
