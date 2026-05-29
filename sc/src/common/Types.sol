// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/// @title Equinox Shared Types
/// @notice Central type definitions shared across the Equinox vault, adapters, and agent registry.
enum RiskProfile {
    /// @notice Capital-preservation profile with the strictest allocation caps.
    Conservative,
    /// @notice Mid-risk profile used as the default Equinox portfolio posture.
    Balanced,
    /// @notice Higher-risk profile with the loosest allocation caps.
    Aggressive
}

/// @notice Canonical venue classification exposed by strategy adapters.
enum VenueType {
    /// @notice Funds remain idle inside the mock ecosystem.
    Idle,
    /// @notice Funds are routed to a simulated on-chain lending venue.
    DeFiLending,
    /// @notice Funds are routed to a simulated CeFi earn venue.
    CeFiEarn
}

/// @notice Enumerates the guardrail reason returned by rebalance preview checks.
enum RebalanceRejectionReason {
    /// @notice No rejection occurred.
    None,
    /// @notice No strategy targets were supplied.
    EmptyTargets,
    /// @notice One of the requested assets is not tracked by the vault.
    UnsupportedAsset,
    /// @notice One of the requested adapters is not approved for the target asset.
    UnapprovedAdapter,
    /// @notice The same asset-adapter pair appears more than once.
    DuplicateTarget,
    /// @notice The target weights do not sum to `10_000` basis points.
    WeightSumMismatch,
    /// @notice The requested asset exposure breaches the active risk-profile cap.
    AssetRiskLimitExceeded,
    /// @notice The adapter snapshot risk score exceeds the vault tolerance.
    AdapterRiskTooHigh,
    /// @notice The mock exchange has no configured price for an asset.
    MissingPrice
}

/// @notice Aggregated on-chain performance and activity statistics for an agent identity.
struct AgentStats {
    /// @notice Total decisions logged for the agent.
    uint64 totalDecisions;
    /// @notice Successful non-blocked decisions with non-negative performance.
    uint64 successfulDecisions;
    /// @notice Decisions blocked by vault guardrails.
    uint64 blockedDecisions;
    /// @notice Timestamp of the latest logged decision.
    uint64 lastDecisionAt;
    /// @notice Running total of logged performance in basis points.
    int256 cumulativePerformanceBps;
    /// @notice Derived reputation score on a 0-100 scale.
    uint16 reputationScore;
}

/// @notice Single historical decision entry attached to an agent identity.
struct DecisionRecord {
    /// @notice Hash of the reasoning payload stored off-chain.
    bytes32 reasoningHash;
    /// @notice Performance value attributed to the decision in basis points.
    int256 performanceBps;
    /// @notice Block timestamp when the decision was logged.
    uint64 timestamp;
    /// @notice Whether the decision was blocked by guardrails instead of executed.
    bool blockedByGuardrail;
    /// @notice URI pointing to the richer reasoning payload or report.
    string detailsURI;
}

/// @notice Per-asset policy caps enforced by the vault.
struct AssetPolicy {
    /// @notice Whether the asset can be used by the vault.
    bool enabled;
    /// @notice Off-chain risk tier classification.
    uint8 riskTier;
    /// @notice Maximum allocation caps for Conservative, Balanced, and Aggressive profiles.
    uint16[3] maxAllocationBps;
}

/// @notice Target allocation directive for one asset-adapter pair.
struct StrategyTarget {
    /// @notice Asset to be allocated.
    address asset;
    /// @notice Approved strategy adapter chosen for the asset.
    address adapter;
    /// @notice Requested weight in basis points.
    uint16 weightBps;
}

/// @notice Snapshot payload used by mock adapters to simulate market conditions.
struct MarketSnapshot {
    /// @notice Simulated annual percentage yield in basis points.
    uint32 apyBps;
    /// @notice Adapter risk score consumed by vault guardrails.
    uint16 riskScore;
    /// @notice Adapter liquidity score exposed to off-chain systems.
    uint16 liquidityScore;
    /// @notice Timestamp from the upstream market-data source.
    uint64 sourceTimestamp;
    /// @notice Hash of the upstream market-data payload.
    bytes32 sourceHash;
}

/// @notice Structured result returned by `previewRebalance`.
struct PreviewResult {
    /// @notice Whether the proposed rebalance is executable.
    bool ok;
    /// @notice Rejection code when `ok` is false.
    RebalanceRejectionReason reason;
    /// @notice Asset responsible for the rejection when applicable.
    address offendingAsset;
    /// @notice Adapter responsible for the rejection when applicable.
    address offendingAdapter;
    /// @notice Weight attempted by the rejected target.
    uint16 attemptedWeightBps;
    /// @notice Limit value that was breached by the rejected target.
    uint16 limitWeightBps;
    /// @notice Total weight accumulated during preview evaluation.
    uint16 totalWeightBps;
}
