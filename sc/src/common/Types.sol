// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

enum RiskProfile {
    Conservative,
    Balanced,
    Aggressive
}

enum VenueType {
    Idle,
    DeFiLending,
    CeFiEarn
}

enum RebalanceRejectionReason {
    None,
    EmptyTargets,
    UnsupportedAsset,
    UnapprovedAdapter,
    DuplicateTarget,
    WeightSumMismatch,
    AssetRiskLimitExceeded,
    AdapterRiskTooHigh,
    MissingPrice
}

struct AgentStats {
    uint64 totalDecisions;
    uint64 successfulDecisions;
    uint64 blockedDecisions;
    uint64 lastDecisionAt;
    int256 cumulativePerformanceBps;
    uint16 reputationScore;
}

struct DecisionRecord {
    bytes32 reasoningHash;
    int256 performanceBps;
    uint64 timestamp;
    bool blockedByGuardrail;
    string detailsURI;
}

struct AssetPolicy {
    bool enabled;
    uint8 riskTier;
    uint16[3] maxAllocationBps;
}

struct StrategyTarget {
    address asset;
    address adapter;
    uint16 weightBps;
}

struct MarketSnapshot {
    uint32 apyBps;
    uint16 riskScore;
    uint16 liquidityScore;
    uint64 sourceTimestamp;
    bytes32 sourceHash;
}

struct PreviewResult {
    bool ok;
    RebalanceRejectionReason reason;
    address offendingAsset;
    address offendingAdapter;
    uint16 attemptedWeightBps;
    uint16 limitWeightBps;
    uint16 totalWeightBps;
}
