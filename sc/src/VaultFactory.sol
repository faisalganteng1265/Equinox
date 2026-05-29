// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";

import {MantleAgentRegistry8004} from "./MantleAgentRegistry8004.sol";
import {MantleVaultOrchestrator} from "./MantleVaultOrchestrator.sol";
import {AgentAlreadyBound, InvalidArrayLength, VaultAlreadyExists, ZeroAddress} from "./common/Errors.sol";
import {RiskProfile} from "./common/Types.sol";
import {IMockAssetExchange} from "./interfaces/IMockAssetExchange.sol";
import {IStrategyRegistry} from "./interfaces/IStrategyRegistry.sol";

/// @title Equinox Vault Factory
/// @notice Deploys one personal vault and one agent identity per user while sharing backend orchestration.
contract VaultFactory is Ownable, Pausable {
    MantleAgentRegistry8004 public immutable agentRegistry;
    IStrategyRegistry public immutable strategyRegistry;
    IMockAssetExchange public immutable assetExchange;

    address public authorizedAgent;
    address public agentWallet;
    RiskProfile public defaultRiskProfile;

    address[] private _assets;
    uint8[] private _riskTiers;
    uint16[3][] private _maxAllocationBps;
    address[] private _allVaults;

    mapping(address => address) public vaultOfOwner;
    mapping(address => address) public ownerOfVault;
    mapping(address => uint256) public agentOfVault;
    mapping(uint256 => address) public vaultOfAgent;

    event AuthorizedAgentUpdated(address indexed previousAgent, address indexed newAgent);
    event AgentWalletUpdated(address indexed previousAgentWallet, address indexed newAgentWallet);
    event DefaultRiskProfileUpdated(RiskProfile previousProfile, RiskProfile newProfile);
    event VaultCreated(address indexed owner, address indexed vault, uint256 indexed agentId, address agentWallet);

    constructor(
        MantleAgentRegistry8004 agentRegistry_,
        IStrategyRegistry strategyRegistry_,
        IMockAssetExchange assetExchange_,
        address authorizedAgent_,
        address agentWallet_,
        RiskProfile defaultRiskProfile_,
        address[] memory assets_,
        uint8[] memory riskTiers_,
        uint16[3][] memory maxAllocationBps_
    ) {
        if (
            address(agentRegistry_) == address(0) || address(strategyRegistry_) == address(0)
                || address(assetExchange_) == address(0) || authorizedAgent_ == address(0) || agentWallet_ == address(0)
        ) revert ZeroAddress();
        if (assets_.length == 0 || assets_.length != riskTiers_.length || assets_.length != maxAllocationBps_.length) {
            revert InvalidArrayLength();
        }

        agentRegistry = agentRegistry_;
        strategyRegistry = strategyRegistry_;
        assetExchange = assetExchange_;
        authorizedAgent = authorizedAgent_;
        agentWallet = agentWallet_;
        defaultRiskProfile = defaultRiskProfile_;

        for (uint256 i = 0; i < assets_.length; i++) {
            if (assets_[i] == address(0)) revert ZeroAddress();
            _assets.push(assets_[i]);
            _riskTiers.push(riskTiers_[i]);
            _maxAllocationBps.push(maxAllocationBps_[i]);
        }
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setAuthorizedAgent(address newAuthorizedAgent) external onlyOwner {
        if (newAuthorizedAgent == address(0)) revert ZeroAddress();

        address previousAgent = authorizedAgent;
        authorizedAgent = newAuthorizedAgent;
        emit AuthorizedAgentUpdated(previousAgent, newAuthorizedAgent);
    }

    function setAgentWallet(address newAgentWallet) external onlyOwner {
        if (newAgentWallet == address(0)) revert ZeroAddress();

        address previousAgentWallet = agentWallet;
        agentWallet = newAgentWallet;
        emit AgentWalletUpdated(previousAgentWallet, newAgentWallet);
    }

    function setDefaultRiskProfile(RiskProfile newDefaultRiskProfile) external onlyOwner {
        RiskProfile previousProfile = defaultRiskProfile;
        defaultRiskProfile = newDefaultRiskProfile;
        emit DefaultRiskProfileUpdated(previousProfile, newDefaultRiskProfile);
    }

    function createVault(string calldata agentURI) external whenNotPaused returns (address vault, uint256 agentId) {
        return _createVault(msg.sender, agentURI);
    }

    function createVaultFor(address vaultOwner, string calldata agentURI)
        external
        onlyOwner
        whenNotPaused
        returns (address vault, uint256 agentId)
    {
        return _createVault(vaultOwner, agentURI);
    }

    function getAssets() external view returns (address[] memory assets) {
        return _assets;
    }

    function getRiskTiers() external view returns (uint8[] memory riskTiers) {
        return _riskTiers;
    }

    function getMaxAllocationBps() external view returns (uint16[3][] memory maxAllocationBps) {
        return _maxAllocationBps;
    }

    function allVaults() external view returns (address[] memory vaults) {
        return _allVaults;
    }

    function vaultCount() external view returns (uint256 count) {
        return _allVaults.length;
    }

    function _createVault(address vaultOwner, string calldata agentURI)
        internal
        returns (address vault, uint256 agentId)
    {
        if (vaultOwner == address(0)) revert ZeroAddress();
        address existingVault = vaultOfOwner[vaultOwner];
        if (existingVault != address(0)) revert VaultAlreadyExists(vaultOwner, existingVault);

        agentId = agentRegistry.registerAgent(vaultOwner, agentWallet, agentURI);

        vault = address(
            new MantleVaultOrchestrator(
                vaultOwner,
                authorizedAgent,
                agentRegistry,
                strategyRegistry,
                assetExchange,
                agentId,
                defaultRiskProfile,
                _copyAssets(),
                _copyRiskTiers(),
                _copyMaxAllocationBps()
            )
        );

        if (vaultOfAgent[agentId] != address(0)) revert AgentAlreadyBound(agentId, vaultOfAgent[agentId]);

        agentRegistry.grantRole(agentRegistry.LOGGER_ROLE(), vault);

        vaultOfOwner[vaultOwner] = vault;
        ownerOfVault[vault] = vaultOwner;
        agentOfVault[vault] = agentId;
        vaultOfAgent[agentId] = vault;
        _allVaults.push(vault);

        emit VaultCreated(vaultOwner, vault, agentId, agentWallet);
    }

    function _copyAssets() internal view returns (address[] memory assets) {
        assets = new address[](_assets.length);
        for (uint256 i = 0; i < _assets.length; i++) {
            assets[i] = _assets[i];
        }
    }

    function _copyRiskTiers() internal view returns (uint8[] memory riskTiers) {
        riskTiers = new uint8[](_riskTiers.length);
        for (uint256 i = 0; i < _riskTiers.length; i++) {
            riskTiers[i] = _riskTiers[i];
        }
    }

    function _copyMaxAllocationBps() internal view returns (uint16[3][] memory maxAllocationBps) {
        maxAllocationBps = new uint16[3][](_maxAllocationBps.length);
        for (uint256 i = 0; i < _maxAllocationBps.length; i++) {
            maxAllocationBps[i] = _maxAllocationBps[i];
        }
    }
}
