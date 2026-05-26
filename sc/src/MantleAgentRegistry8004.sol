// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";

import {AgentStats, DecisionRecord} from "./common/Types.sol";
import {EmptyReasoningHash, UnauthorizedRegistryManager, ZeroAddress} from "./common/Errors.sol";
import {IMantleAgentRegistry8004} from "./interfaces/IMantleAgentRegistry8004.sol";

contract MantleAgentRegistry8004 is ERC721URIStorage, AccessControl, Pausable, IMantleAgentRegistry8004 {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE"); // Dedicated role for minting and updating agents.
    bytes32 public constant LOGGER_ROLE = keccak256("LOGGER_ROLE"); // Dedicated role for decision and performance logging.

    string public contractURI;

    uint256 private _nextAgentId = 1;
    mapping(uint256 => address) public agentWallets;
    mapping(uint256 => AgentStats) private _agentStats;
    mapping(uint256 => DecisionRecord[]) private _decisionHistory;
    mapping(uint256 => mapping(bytes32 => bytes)) private _metadata;

    event ContractURIUpdated(address indexed caller, string contractURI);
    event AgentRegistered(address indexed recipient, uint256 agentId, address agentWallet, string agentURI);
    event AgentURIUpdated(address indexed caller, uint256 agentId, string agentURI);
    event AgentWalletUpdated(address indexed caller, uint256 agentId, address agentWallet);
    event MetadataUpdated(address indexed caller, uint256 agentId, string key, bytes value);
    event DecisionLogged(
        address indexed logger,
        uint256 agentId,
        bytes32 reasoningHash,
        int256 performanceBps,
        bool blockedByGuardrail,
        string detailsURI
    );
    event RegistryPaused(address indexed caller);
    event RegistryUnpaused(address indexed caller);

    /// @notice Deploys the Equinox agent registry.
    /// @param name_ ERC-721 collection name for agent identities.
    /// @param symbol_ ERC-721 collection symbol for agent identities.
    /// @param contractURI_ Collection-level metadata URI.
    /// @param admin_ Initial admin address for access-control roles.
    constructor(string memory name_, string memory symbol_, string memory contractURI_, address admin_)
        ERC721(name_, symbol_)
    {
        if (admin_ == address(0)) revert ZeroAddress();

        contractURI = contractURI_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(REGISTRAR_ROLE, admin_);
        _grantRole(LOGGER_ROLE, admin_);
    }

    /// @notice Pauses all state-changing registry operations.
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
        emit RegistryPaused(msg.sender);
    }

    /// @notice Unpauses all state-changing registry operations.
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
        emit RegistryUnpaused(msg.sender);
    }

    /// @notice Updates the collection-level metadata URI.
    /// @param newContractURI New collection metadata URI.
    function setContractURI(string calldata newContractURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        contractURI = newContractURI;
        emit ContractURIUpdated(msg.sender, newContractURI);
    }

    /// @notice Registers a new agent identity and mints its ERC-721 token.
    /// @param recipient Address receiving ownership of the agent NFT.
    /// @param agentWallet Address used by the agent for off-chain or execution identity.
    /// @param agentURI Metadata URI describing the agent.
    /// @return agentId Newly minted agent identifier.
    function registerAgent(address recipient, address agentWallet, string calldata agentURI)
        external
        onlyRole(REGISTRAR_ROLE)
        whenNotPaused
        returns (uint256 agentId)
    {
        if (recipient == address(0) || agentWallet == address(0)) revert ZeroAddress();

        agentId = _nextAgentId;
        _nextAgentId = agentId + 1;

        _safeMint(recipient, agentId);
        _setTokenURI(agentId, agentURI);
        agentWallets[agentId] = agentWallet;
        _metadata[agentId][keccak256(bytes("agentWallet"))] = abi.encode(agentWallet);

        emit AgentRegistered(recipient, agentId, agentWallet, agentURI);
    }

    /// @notice Updates the token URI for an existing agent.
    /// @param agentId Agent identifier to update.
    /// @param agentURI New metadata URI.
    function updateAgentURI(uint256 agentId, string calldata agentURI) external whenNotPaused {
        _requireAgentManager(agentId);
        _setTokenURI(agentId, agentURI);
        emit AgentURIUpdated(msg.sender, agentId, agentURI);
    }

    /// @notice Updates the wallet address associated with an agent.
    /// @param agentId Agent identifier to update.
    /// @param agentWallet New wallet address for the agent.
    function setAgentWallet(uint256 agentId, address agentWallet) external whenNotPaused {
        if (agentWallet == address(0)) revert ZeroAddress();

        _requireAgentManager(agentId);
        agentWallets[agentId] = agentWallet;
        _metadata[agentId][keccak256(bytes("agentWallet"))] = abi.encode(agentWallet);

        emit AgentWalletUpdated(msg.sender, agentId, agentWallet);
    }

    /// @notice Stores optional on-chain metadata for an agent.
    /// @param agentId Agent identifier to update.
    /// @param key Metadata key to update.
    /// @param value ABI-encoded metadata value.
    function setMetadata(uint256 agentId, string calldata key, bytes calldata value) external whenNotPaused {
        _requireAgentManager(agentId);
        _metadata[agentId][keccak256(bytes(key))] = value;
        emit MetadataUpdated(msg.sender, agentId, key, value);
    }

    /// @notice Reads optional on-chain metadata for an agent.
    /// @param agentId Agent identifier to read.
    /// @param key Metadata key to fetch.
    /// @return value ABI-encoded metadata value.
    function getMetadata(uint256 agentId, string calldata key) external view returns (bytes memory value) {
        _requireMinted(agentId);
        return _metadata[agentId][keccak256(bytes(key))];
    }

    /// @notice Records a rebalance or performance decision for an agent.
    /// @param agentId Agent identifier receiving the decision record.
    /// @param reasoningHash Hash of the off-chain reasoning payload.
    /// @param performanceBps Performance impact in basis points.
    /// @param blockedByGuardrail Whether the decision was blocked by policy checks.
    /// @param detailsURI Optional URI with full reasoning or analytics.
    function logDecision(
        uint256 agentId,
        bytes32 reasoningHash,
        int256 performanceBps,
        bool blockedByGuardrail,
        string calldata detailsURI
    ) external onlyRole(LOGGER_ROLE) whenNotPaused {
        if (reasoningHash == bytes32(0)) revert EmptyReasoningHash();

        _requireMinted(agentId);

        _decisionHistory[agentId].push(
            DecisionRecord({
                reasoningHash: reasoningHash,
                performanceBps: performanceBps,
                timestamp: uint64(block.timestamp),
                blockedByGuardrail: blockedByGuardrail,
                detailsURI: detailsURI
            })
        );

        AgentStats storage stats = _agentStats[agentId];
        stats.totalDecisions += 1;
        stats.lastDecisionAt = uint64(block.timestamp);
        stats.cumulativePerformanceBps += performanceBps;

        if (blockedByGuardrail) {
            stats.blockedDecisions += 1;
        } else if (performanceBps >= 0) {
            stats.successfulDecisions += 1;
        }

        stats.reputationScore = _calculateReputationScore(stats);

        emit DecisionLogged(msg.sender, agentId, reasoningHash, performanceBps, blockedByGuardrail, detailsURI);
    }

    /// @notice Returns whether an agent has been registered.
    /// @param agentId Agent identifier to check.
    /// @return registered True when the agent exists.
    function exists(uint256 agentId) external view returns (bool registered) {
        return _exists(agentId);
    }

    /// @notice Returns aggregate statistics for an agent.
    /// @param agentId Agent identifier to query.
    /// @return stats Aggregated reputation and activity metrics.
    function getAgentStats(uint256 agentId) external view returns (AgentStats memory stats) {
        _requireMinted(agentId);
        return _agentStats[agentId];
    }

    /// @notice Returns the number of decisions recorded for an agent.
    /// @param agentId Agent identifier to query.
    /// @return count Number of stored decisions.
    function getDecisionCount(uint256 agentId) external view returns (uint256 count) {
        _requireMinted(agentId);
        return _decisionHistory[agentId].length;
    }

    /// @notice Returns a specific decision record for an agent.
    /// @param agentId Agent identifier to query.
    /// @param index Zero-based decision index.
    /// @return decision Stored decision record.
    function getDecision(uint256 agentId, uint256 index) external view returns (DecisionRecord memory decision) {
        _requireMinted(agentId);
        return _decisionHistory[agentId][index];
    }

    /// @notice Returns the interfaces supported by this contract.
    /// @param interfaceId Interface selector to query.
    /// @return supported True when the interface is implemented.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool supported)
    {
        return super.supportsInterface(interfaceId);
    }

    function _requireAgentManager(uint256 agentId) internal view {
        _requireMinted(agentId);

        if (!_isApprovedOrOwner(msg.sender, agentId) && !hasRole(REGISTRAR_ROLE, msg.sender)) {
            revert UnauthorizedRegistryManager(msg.sender, agentId);
        }
    }

    function _calculateReputationScore(AgentStats memory stats) internal pure returns (uint16 score) {
        if (stats.totalDecisions == 0) {
            return 50;
        }

        uint256 totalDecisions = uint256(stats.totalDecisions);
        uint256 successScore = (uint256(stats.successfulDecisions) * 60) / totalDecisions;
        uint256 blockedPenalty = (uint256(stats.blockedDecisions) * 20) / totalDecisions;

        int256 averagePerformance = stats.cumulativePerformanceBps / int256(totalDecisions);
        uint256 performanceScore;

        if (averagePerformance >= 1_500) {
            performanceScore = 30;
        } else if (averagePerformance <= -1_500) {
            performanceScore = 0;
        } else {
            performanceScore = uint256((15 + ((averagePerformance * 15) / 1_500)));
        }

        int256 rawScore = int256(20 + successScore + performanceScore) - int256(blockedPenalty);
        if (rawScore < 0) {
            return 0;
        }
        if (rawScore > 100) {
            return 100;
        }

        return uint16(uint256(rawScore));
    }
}
