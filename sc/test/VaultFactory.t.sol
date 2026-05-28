// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {MantleVaultOrchestrator} from "../src/MantleVaultOrchestrator.sol";
import {VaultFactory} from "../src/VaultFactory.sol";
import {VaultAlreadyExists, ZeroAddress} from "../src/common/Errors.sol";
import {DecisionRecord, RiskProfile, StrategyTarget} from "../src/common/Types.sol";
import {EquinoxVaultFixture} from "./utils/EquinoxVaultFixture.sol";

contract VaultFactoryTest is EquinoxVaultFixture {
    VaultFactory internal factory;

    address internal userA = makeAddr("userA");
    address internal userB = makeAddr("userB");

    function setUp() public {
        _setUpVaultFixture();

        vm.startPrank(admin);
        factory = new VaultFactory(
            registry,
            strategyRegistry,
            exchange,
            authorizedAgent,
            agentWallet,
            RiskProfile.Balanced,
            _assets(),
            _riskTiers(),
            _maxAllocationBps()
        );
        registry.grantRole(registry.DEFAULT_ADMIN_ROLE(), address(factory));
        registry.grantRole(registry.REGISTRAR_ROLE(), address(factory));
        vm.stopPrank();
    }

    function test_createVault_mintsUserAgentAndDeploysOwnedVault() public {
        vm.prank(userA);
        (address userVaultAddress, uint256 userAgentId) = factory.createVault("ipfs://agent-user-a");

        MantleVaultOrchestrator userVault = MantleVaultOrchestrator(userVaultAddress);

        assertEq(factory.vaultOfOwner(userA), userVaultAddress);
        assertEq(factory.ownerOfVault(userVaultAddress), userA);
        assertEq(factory.agentOfVault(userVaultAddress), userAgentId);
        assertEq(factory.vaultOfAgent(userAgentId), userVaultAddress);
        assertEq(factory.vaultCount(), 1);

        assertEq(userVault.owner(), userA);
        assertEq(userVault.authorizedAgent(), authorizedAgent);
        assertEq(userVault.agentId(), userAgentId);
        assertEq(uint8(userVault.currentRiskProfile()), uint8(RiskProfile.Balanced));

        assertEq(registry.ownerOf(userAgentId), userA);
        assertEq(registry.agentWallets(userAgentId), agentWallet);
        assertTrue(registry.hasRole(registry.LOGGER_ROLE(), userVaultAddress));
    }

    function test_createVaultFor_allowsAdminSponsoredUserVault() public {
        vm.prank(admin);
        (address userVaultAddress, uint256 userAgentId) = factory.createVaultFor(userB, "ipfs://agent-user-b");

        assertEq(factory.vaultOfOwner(userB), userVaultAddress);
        assertEq(registry.ownerOf(userAgentId), userB);
        assertEq(MantleVaultOrchestrator(userVaultAddress).owner(), userB);
    }

    function test_createVault_revertsWhenOwnerAlreadyHasVault() public {
        vm.prank(userA);
        (address userVaultAddress,) = factory.createVault("ipfs://agent-user-a");

        vm.prank(userA);
        vm.expectRevert(abi.encodeWithSelector(VaultAlreadyExists.selector, userA, userVaultAddress));
        factory.createVault("ipfs://agent-user-a-duplicate");
    }

    function test_createVaultFor_revertsForZeroOwner() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(ZeroAddress.selector));
        factory.createVaultFor(address(0), "ipfs://agent-zero");
    }

    function test_factoryVaultCanLogRebalanceDecision() public {
        vm.prank(userA);
        (address userVaultAddress, uint256 userAgentId) = factory.createVault("ipfs://agent-user-a");
        MantleVaultOrchestrator userVault = MantleVaultOrchestrator(userVaultAddress);

        vm.prank(admin);
        usdy.mint(userA, 10_000e18);

        vm.startPrank(userA);
        usdy.approve(userVaultAddress, 10_000e18);
        userVault.deposit(address(usdy), 10_000e18);
        vm.stopPrank();

        StrategyTarget[] memory targets = new StrategyTarget[](3);
        targets[0] = StrategyTarget({asset: address(usdy), adapter: address(usdyIdle), weightBps: 5_000});
        targets[1] = StrategyTarget({asset: address(mEth), adapter: address(mEthDefi), weightBps: 4_000});
        targets[2] = StrategyTarget({asset: address(fBtc), adapter: address(fBtcCefi), weightBps: 1_000});

        bytes32 reasoningHash = keccak256("factory-vault-rebalance");

        vm.prank(authorizedAgent);
        userVault.executeRebalance(targets, reasoningHash, "ipfs://decision-user-a");

        DecisionRecord memory decision = registry.getDecision(userAgentId, 0);
        assertEq(decision.reasoningHash, reasoningHash);
        assertEq(decision.detailsURI, "ipfs://decision-user-a");
        assertEq(registry.getDecisionCount(userAgentId), 1);
    }

    function _assets() internal view returns (address[] memory assets) {
        assets = new address[](4);
        assets[0] = address(usdy);
        assets[1] = address(mEth);
        assets[2] = address(fBtc);
        assets[3] = address(mi4);
    }

    function _riskTiers() internal pure returns (uint8[] memory riskTiers) {
        riskTiers = new uint8[](4);
        riskTiers[0] = 0;
        riskTiers[1] = 1;
        riskTiers[2] = 2;
        riskTiers[3] = 2;
    }

    function _maxAllocationBps() internal pure returns (uint16[3][] memory maxAllocationBps) {
        maxAllocationBps = new uint16[3][](4);
        maxAllocationBps[0] = [uint16(7_000), uint16(5_000), uint16(3_500)];
        maxAllocationBps[1] = [uint16(3_500), uint16(4_500), uint16(5_000)];
        maxAllocationBps[2] = [uint16(2_000), uint16(3_000), uint16(4_000)];
        maxAllocationBps[3] = [uint16(1_500), uint16(2_500), uint16(3_500)];
    }
}
