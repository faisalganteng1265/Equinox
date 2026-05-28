import type { Abi } from "viem";

import agentRegistryArtifact from "../../../sc/out/MantleAgentRegistry8004.sol/MantleAgentRegistry8004.json" with { type: "json" };
import strategyAdapterArtifact from "../../../sc/out/IStrategyAdapter.sol/IStrategyAdapter.json" with { type: "json" };
import baseAdapterArtifact from "../../../sc/out/BaseMockYieldAdapter.sol/BaseMockYieldAdapter.json" with { type: "json" };
import exchangeArtifact from "../../../sc/out/MockAssetExchange.sol/MockAssetExchange.json" with { type: "json" };
import tokenArtifact from "../../../sc/out/MockAssetToken.sol/MockAssetToken.json" with { type: "json" };
import strategyRegistryArtifact from "../../../sc/out/StrategyRegistry.sol/StrategyRegistry.json" with { type: "json" };
import vaultArtifact from "../../../sc/out/MantleVaultOrchestrator.sol/MantleVaultOrchestrator.json" with { type: "json" };
import vaultFactoryArtifact from "../../../sc/out/VaultFactory.sol/VaultFactory.json" with { type: "json" };

type ArtifactWithAbi = {
  abi: Abi;
};

export const vaultAbi = (vaultArtifact as ArtifactWithAbi).abi;
export const vaultFactoryAbi = (vaultFactoryArtifact as ArtifactWithAbi).abi;
export const agentRegistryAbi = (agentRegistryArtifact as ArtifactWithAbi).abi;
export const strategyRegistryAbi = (strategyRegistryArtifact as ArtifactWithAbi).abi;
export const exchangeAbi = (exchangeArtifact as ArtifactWithAbi).abi;
export const tokenAbi = (tokenArtifact as ArtifactWithAbi).abi;
export const strategyAdapterAbi = (strategyAdapterArtifact as ArtifactWithAbi).abi;
export const baseAdapterAbi = (baseAdapterArtifact as ArtifactWithAbi).abi;
