// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Test} from "forge-std/Test.sol";

import {MantleAgentRegistry8004} from "../src/MantleAgentRegistry8004.sol";
import {AgentStats, DecisionRecord} from "../src/common/Types.sol";
import {EmptyReasoningHash, UnauthorizedRegistryManager, ZeroAddress} from "../src/common/Errors.sol";

/// @title Mantle Agent Registry Test
/// @notice Unit tests for agent registration, metadata updates, and decision logging.
contract MantleAgentRegistry8004Test is Test {
    MantleAgentRegistry8004 internal registry;

    address internal admin = makeAddr("admin");
    address internal agentOwner = makeAddr("agentOwner");
    address internal agentWallet = makeAddr("agentWallet");
    address internal logger = makeAddr("logger");

    /// @notice Deploys a registry fixture and grants logger permissions.
    function setUp() public {
        vm.startPrank(admin);
        registry = new MantleAgentRegistry8004("Equinox Agent Registry", "EQAGENT", "ipfs://registry-contract", admin);
        registry.grantRole(registry.LOGGER_ROLE(), logger);
        vm.stopPrank();
    }

    /// @notice Verifies that agent registration mints an identity token and stores metadata pointers.
    function test_registerAgent_mintsIdentityAndStoresWallet() public {
        vm.prank(admin);
        uint256 agentId = registry.registerAgent(agentOwner, agentWallet, "ipfs://agent-1");

        assertEq(agentId, 1);
        assertEq(registry.ownerOf(agentId), agentOwner);
        assertEq(registry.agentWallets(agentId), agentWallet);
        assertEq(registry.tokenURI(agentId), "ipfs://agent-1");
        assertTrue(registry.exists(agentId));
    }

    /// @notice Verifies that registration rejects zero-address recipients.
    function test_registerAgent_revertsForZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(ZeroAddress.selector));
        registry.registerAgent(address(0), agentWallet, "ipfs://agent-1");
    }

    /// @notice Verifies that the agent owner can update the token URI.
    function test_updateAgentURI_allowsOwner() public {
        vm.prank(admin);
        uint256 agentId = registry.registerAgent(agentOwner, agentWallet, "ipfs://agent-1");

        vm.prank(agentOwner);
        registry.updateAgentURI(agentId, "ipfs://agent-1-v2");

        assertEq(registry.tokenURI(agentId), "ipfs://agent-1-v2");
    }

    /// @notice Verifies that unauthorized callers cannot update an agent URI.
    function test_updateAgentURI_revertsForUnauthorizedCaller() public {
        vm.prank(admin);
        uint256 agentId = registry.registerAgent(agentOwner, agentWallet, "ipfs://agent-1");

        vm.prank(logger);
        vm.expectRevert(abi.encodeWithSelector(UnauthorizedRegistryManager.selector, logger, agentId));
        registry.updateAgentURI(agentId, "ipfs://agent-1-v2");
    }

    /// @notice Verifies that decision logging updates stored records and aggregate statistics.
    function test_logDecision_updatesStatsAndHistory() public {
        vm.prank(admin);
        uint256 agentId = registry.registerAgent(agentOwner, agentWallet, "ipfs://agent-1");

        bytes32 reasoningHash = keccak256("rebalance-1");

        vm.prank(logger);
        registry.logDecision(agentId, reasoningHash, 120, false, "ipfs://decision-1");

        AgentStats memory stats = registry.getAgentStats(agentId);
        DecisionRecord memory record = registry.getDecision(agentId, 0);

        assertEq(stats.totalDecisions, 1);
        assertEq(stats.successfulDecisions, 1);
        assertEq(stats.blockedDecisions, 0);
        assertEq(stats.cumulativePerformanceBps, 120);
        assertEq(stats.reputationScore, 96);

        assertEq(record.reasoningHash, reasoningHash);
        assertEq(record.performanceBps, 120);
        assertEq(record.blockedByGuardrail, false);
        assertEq(record.detailsURI, "ipfs://decision-1");
    }

    /// @notice Verifies that decision logging is restricted to logger-role accounts.
    function test_logDecision_revertsWithoutRole() public {
        vm.prank(admin);
        uint256 agentId = registry.registerAgent(agentOwner, agentWallet, "ipfs://agent-1");

        vm.prank(agentOwner);
        vm.expectRevert();
        registry.logDecision(agentId, keccak256("rebalance-1"), 100, false, "ipfs://decision-1");
    }

    /// @notice Verifies that empty reasoning hashes are rejected.
    function test_logDecision_revertsForEmptyReasoningHash() public {
        vm.prank(admin);
        uint256 agentId = registry.registerAgent(agentOwner, agentWallet, "ipfs://agent-1");

        vm.prank(logger);
        vm.expectRevert(abi.encodeWithSelector(EmptyReasoningHash.selector));
        registry.logDecision(agentId, bytes32(0), 0, false, "ipfs://decision-1");
    }
}
