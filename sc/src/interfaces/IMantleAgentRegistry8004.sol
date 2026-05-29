// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {AgentStats, DecisionRecord} from "../common/Types.sol";

/// @title Mantle Agent Registry Interface
/// @notice Minimal agent-registry surface consumed by the vault and factory.
interface IMantleAgentRegistry8004 {
    /// @notice Returns whether an agent identity exists in the registry.
    /// @param agentId Agent identifier to query.
    /// @return registered True when the agent token has been minted.
    function exists(uint256 agentId) external view returns (bool);

    /// @notice Persists a decision or execution outcome for a registered agent.
    /// @param agentId Agent identifier receiving the decision record.
    /// @param reasoningHash Hash of the off-chain reasoning payload.
    /// @param performanceBps Performance impact in basis points.
    /// @param blockedByGuardrail True when the decision was rejected by policy checks.
    /// @param detailsURI Optional URI pointing to the full decision context.
    function logDecision(
        uint256 agentId,
        bytes32 reasoningHash,
        int256 performanceBps,
        bool blockedByGuardrail,
        string calldata detailsURI
    ) external;

    /// @notice Returns aggregate statistics for a registered agent.
    /// @param agentId Agent identifier to query.
    /// @return stats Current decision and reputation statistics.
    function getAgentStats(uint256 agentId) external view returns (AgentStats memory);

    /// @notice Returns a historical decision record for a registered agent.
    /// @param agentId Agent identifier to query.
    /// @param index Zero-based index inside the decision history.
    /// @return decision Stored decision record.
    function getDecision(uint256 agentId, uint256 index) external view returns (DecisionRecord memory);

    /// @notice Returns the number of stored decisions for a registered agent.
    /// @param agentId Agent identifier to query.
    /// @return count Total number of stored decision records.
    function getDecisionCount(uint256 agentId) external view returns (uint256);
}
