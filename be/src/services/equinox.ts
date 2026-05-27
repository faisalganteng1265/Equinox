import {
  formatUnits,
  isAddress,
  parseUnits,
  type Address,
  type Abi,
  type Hex,
} from "viem";

import {
  agentRegistryAbi,
  baseAdapterAbi,
  exchangeAbi,
  strategyAdapterAbi,
  strategyRegistryAbi,
  tokenAbi,
  vaultAbi,
} from "../contracts/abis.js";
import {
  adapterDefinitionByAddress,
  adapterDefinitionByKey,
  assetDefinitionByAddress,
  assetDefinitionByKey,
  assetDefinitions,
  contractAddresses,
  type AdapterDefinition,
  type AdapterKey,
  type AssetDefinition,
} from "../config/equinox.js";
import { env } from "../config/env.js";
import { AppError } from "../lib/app-error.js";
import { formatFixedE18, formatTokenAmount, rebalanceReasonNames, riskProfileNames, toEnumLabel, venueTypeNames, weightFromValue } from "../lib/format.js";
import { deriveHashFromPayload, normalizeExplicitHash } from "../lib/hash.js";
import { operatorAccount, publicClient, walletClient } from "./clients.js";

interface StrategyTargetInput {
  asset: string;
  adapter?: string;
  weightBps: number;
}

interface SnapshotUpdateInput {
  adapter: string;
  apyBps: number;
  riskScore: number;
  liquidityScore: number;
  sourceTimestamp?: number;
  sourceHash?: string;
  sourceLabel?: string;
}

interface PriceUpdateInput {
  asset: string;
  price?: string;
  priceE18?: string;
}

interface DemoMintInput {
  asset: string;
  recipient: string;
  amount?: string;
  amountRaw?: string;
}

interface VaultAssetPolicy {
  enabled: boolean;
  riskTier: number;
  maxAllocationBps: readonly [number, number, number];
}

interface AdapterSnapshot {
  apyBps: number;
  riskScore: number;
  liquidityScore: number;
  sourceTimestamp: number;
  sourceHash: Hex;
}

interface AgentStatsResult {
  totalDecisions: number;
  successfulDecisions: number;
  blockedDecisions: number;
  lastDecisionAt: number;
  cumulativePerformanceBps: bigint;
  reputationScore: number;
}

interface DecisionResult {
  reasoningHash: Hex;
  performanceBps: bigint;
  timestamp: number;
  blockedByGuardrail: boolean;
  detailsURI: string;
}

interface PreviewResult {
  ok: boolean;
  reason: number;
  offendingAsset: Address;
  offendingAdapter: Address;
  attemptedWeightBps: number;
  limitWeightBps: number;
  totalWeightBps: number;
}

const tokenMetadataCache = new Map<string, Promise<{ name: string; symbol: string; decimals: number }>>();

function addressEq(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase();
}

function resolveAssetDefinition(reference: string): AssetDefinition {
  const byKey = assetDefinitionByKey.get(reference as AssetDefinition["key"]);
  if (byKey) {
    return byKey;
  }

  const lowered = reference.toLowerCase();
  const byAddress = assetDefinitionByAddress.get(lowered);
  if (byAddress) {
    return byAddress;
  }

  const bySymbol = assetDefinitions.find(
    (asset) => asset.symbol.toLowerCase() === lowered || asset.displayName.toLowerCase() === lowered,
  );
  if (bySymbol) {
    return bySymbol;
  }

  throw new AppError(400, `Unknown asset reference: ${reference}`);
}

function resolveAdapterDefinition(reference: string, asset?: AssetDefinition): AdapterDefinition {
  const byKey = adapterDefinitionByKey.get(reference as AdapterKey);
  if (byKey) {
    if (asset && byKey.assetKey !== asset.key) {
      throw new AppError(400, `Adapter ${reference} is not registered for asset ${asset.key}`);
    }
    return byKey;
  }

  const lowered = reference.toLowerCase();
  const byAddress = adapterDefinitionByAddress.get(lowered);
  if (byAddress) {
    if (asset && byAddress.assetKey !== asset.key) {
      throw new AppError(400, `Adapter ${reference} is not registered for asset ${asset.key}`);
    }
    return byAddress;
  }

  throw new AppError(400, `Unknown adapter reference: ${reference}`);
}

function defaultAdapterForAsset(asset: AssetDefinition) {
  const adapter = adapterDefinitionByKey.get(asset.defaultAdapterKey);
  if (!adapter) {
    throw new AppError(500, `Missing default adapter for asset ${asset.key}`);
  }

  return adapter;
}

function normalizeTargets(targets: StrategyTargetInput[]) {
  return targets.map((target) => {
    const asset = resolveAssetDefinition(target.asset);
    const adapter = target.adapter
      ? resolveAdapterDefinition(target.adapter, asset)
      : defaultAdapterForAsset(asset);

    return {
      asset: asset.address,
      assetKey: asset.key,
      adapter: adapter.address,
      adapterKey: adapter.key,
      weightBps: target.weightBps,
    };
  });
}

function normalizeHash(reasoningHash: string | undefined, reasoning: unknown) {
  if (reasoningHash) {
    return normalizeExplicitHash(reasoningHash);
  }
  if (reasoning !== undefined) {
    return deriveHashFromPayload(reasoning);
  }

  throw new AppError(400, "Either reasoningHash or reasoning must be provided");
}

function normalizeSourceHash(sourceHash: string | undefined, sourceLabel: string | undefined, payload: unknown) {
  if (sourceHash) {
    return normalizeExplicitHash(sourceHash);
  }
  if (sourceLabel) {
    return deriveHashFromPayload(sourceLabel);
  }

  return deriveHashFromPayload(payload);
}

function formatReceipt(receipt: {
  transactionHash: Hex;
  blockNumber: bigint;
  gasUsed: bigint;
  status: string;
}) {
  return {
    transactionHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber.toString(),
    gasUsed: receipt.gasUsed.toString(),
    status: receipt.status,
    explorerUrl: `${env.MANTLE_EXPLORER_URL}/tx/${receipt.transactionHash}`,
  };
}

async function getTokenMetadata(assetAddress: Address) {
  const cacheKey = assetAddress.toLowerCase();
  const cached = tokenMetadataCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const metadataPromise = publicClient
    .multicall({
      allowFailure: false,
      contracts: [
        {
          address: assetAddress,
          abi: tokenAbi,
          functionName: "name",
        },
        {
          address: assetAddress,
          abi: tokenAbi,
          functionName: "symbol",
        },
        {
          address: assetAddress,
          abi: tokenAbi,
          functionName: "decimals",
        },
      ],
    })
    .then(([name, symbol, decimals]) => ({
    name: name as string,
    symbol: symbol as string,
    decimals: Number(decimals),
  }));

  tokenMetadataCache.set(cacheKey, metadataPromise);
  return metadataPromise;
}

function serializePreviewResult(result: PreviewResult) {
  const assetDef = assetDefinitionByAddress.get(result.offendingAsset.toLowerCase());
  const adapterDef = adapterDefinitionByAddress.get(result.offendingAdapter.toLowerCase());

  return {
    ok: result.ok,
    reasonCode: result.reason,
    reason: toEnumLabel(result.reason, rebalanceReasonNames),
    offendingAsset: result.offendingAsset,
    offendingAssetKey: assetDef?.key ?? null,
    offendingAdapter: result.offendingAdapter,
    offendingAdapterKey: adapterDef?.key ?? null,
    attemptedWeightBps: result.attemptedWeightBps,
    limitWeightBps: result.limitWeightBps,
    totalWeightBps: result.totalWeightBps,
  };
}

async function writeContractAndWait(parameters: {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
}) {
  const { request } = await publicClient.simulateContract({
    account: operatorAccount,
    chain: publicClient.chain,
    address: parameters.address,
    abi: parameters.abi,
    functionName: parameters.functionName,
    args: parameters.args,
  });

  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    confirmations: env.TX_CONFIRMATIONS,
    timeout: env.TX_TIMEOUT_MS,
  });

  return formatReceipt(receipt);
}

async function loadAssetState(assetDefinition: AssetDefinition, totalPortfolioValueE18: bigint) {
  const assetAddress = assetDefinition.address;
  const tokenMeta = await getTokenMetadata(assetAddress);
  const [policy, targetWeightBps, idleBalance, totalExposure, priceE18, strategyAddresses] =
    (await publicClient.multicall({
      allowFailure: false,
      contracts: [
        {
          address: contractAddresses.vault,
          abi: vaultAbi,
          functionName: "getAssetPolicy",
          args: [assetAddress],
        },
        {
          address: contractAddresses.vault,
          abi: vaultAbi,
          functionName: "getAssetTargetWeight",
          args: [assetAddress],
        },
        {
          address: assetAddress,
          abi: tokenAbi,
          functionName: "balanceOf",
          args: [contractAddresses.vault],
        },
        {
          address: contractAddresses.vault,
          abi: vaultAbi,
          functionName: "getCurrentAssetExposure",
          args: [assetAddress],
        },
        {
          address: contractAddresses.exchange,
          abi: exchangeAbi,
          functionName: "assetPriceE18",
          args: [assetAddress],
        },
        {
          address: contractAddresses.strategyRegistry,
          abi: strategyRegistryAbi,
          functionName: "getStrategies",
          args: [assetAddress],
        },
      ],
    })) as [VaultAssetPolicy, number, bigint, bigint, bigint, Address[]];

  const assetValueE18 = (totalExposure * priceE18) / 10n ** 18n;
  const strategyStates = [];

  for (const strategyAddress of strategyAddresses) {
    const [venueType, totalManagedAssets, vaultWithdrawable, vaultShares, snapshot, targetWeight] =
      (await publicClient.multicall({
        allowFailure: false,
        contracts: [
          {
            address: strategyAddress,
            abi: strategyAdapterAbi,
            functionName: "venueType",
          },
          {
            address: strategyAddress,
            abi: strategyAdapterAbi,
            functionName: "totalManagedAssets",
          },
          {
            address: strategyAddress,
            abi: strategyAdapterAbi,
            functionName: "maxWithdraw",
            args: [contractAddresses.vault],
          },
          {
            address: strategyAddress,
            abi: strategyAdapterAbi,
            functionName: "balanceOf",
            args: [contractAddresses.vault],
          },
          {
            address: strategyAddress,
            abi: strategyAdapterAbi,
            functionName: "latestSnapshot",
          },
          {
            address: contractAddresses.vault,
            abi: vaultAbi,
            functionName: "getStrategyTargetWeight",
            args: [assetAddress, strategyAddress],
          },
        ],
      })) as [number, bigint, bigint, bigint, AdapterSnapshot, number];

    const adapterDefinition = adapterDefinitionByAddress.get(strategyAddress.toLowerCase());
    const strategyValueE18 = (totalManagedAssets * priceE18) / 10n ** 18n;

    strategyStates.push({
      key: adapterDefinition?.key ?? null,
      label: adapterDefinition?.displayName ?? "Strategy Adapter",
      venueLabel: adapterDefinition?.venueLabel ?? toEnumLabel(Number(venueType), venueTypeNames),
      address: strategyAddress,
      venueTypeCode: Number(venueType),
      venueType: toEnumLabel(Number(venueType), venueTypeNames),
      totalManagedAssets: totalManagedAssets.toString(),
      totalManagedAssetsFormatted: formatTokenAmount(totalManagedAssets, tokenMeta.decimals),
      vaultWithdrawable: vaultWithdrawable.toString(),
      vaultWithdrawableFormatted: formatTokenAmount(vaultWithdrawable, tokenMeta.decimals),
      vaultShares: vaultShares.toString(),
      targetWeightBps: Number(targetWeight),
      currentWeightBps: weightFromValue(strategyValueE18, totalPortfolioValueE18),
      latestSnapshot: {
        apyBps: Number(snapshot.apyBps),
        riskScore: Number(snapshot.riskScore),
        liquidityScore: Number(snapshot.liquidityScore),
        sourceTimestamp: Number(snapshot.sourceTimestamp),
        sourceHash: snapshot.sourceHash,
      },
    });
  }

  return {
    key: assetDefinition.key,
    displayName: tokenMeta.name,
    symbol: tokenMeta.symbol,
    configuredLabel: assetDefinition.displayName,
    address: assetAddress,
    decimals: tokenMeta.decimals,
    priceE18: priceE18.toString(),
    priceFormatted: formatFixedE18(priceE18),
    idleBalance: idleBalance.toString(),
    idleBalanceFormatted: formatTokenAmount(idleBalance, tokenMeta.decimals),
    totalExposure: totalExposure.toString(),
    totalExposureFormatted: formatTokenAmount(totalExposure, tokenMeta.decimals),
    assetValueE18: assetValueE18.toString(),
    assetValueFormatted: formatFixedE18(assetValueE18),
    currentWeightBps: weightFromValue(assetValueE18, totalPortfolioValueE18),
    targetWeightBps: Number(targetWeightBps),
    policy: {
      enabled: policy.enabled,
      riskTier: Number(policy.riskTier),
      maxAllocationBps: {
        conservative: Number(policy.maxAllocationBps[0]),
        balanced: Number(policy.maxAllocationBps[1]),
        aggressive: Number(policy.maxAllocationBps[2]),
      },
    },
    strategies: strategyStates,
  };
}

export async function getHealthSnapshot() {
  const [blockNumber, chainId] = await Promise.all([publicClient.getBlockNumber(), publicClient.getChainId()]);

  return {
    status: "ok",
    chainId,
    blockNumber: blockNumber.toString(),
    operatorAddress: operatorAccount.address,
    vaultAddress: contractAddresses.vault,
    timestamp: new Date().toISOString(),
  };
}

export async function getContractsSnapshot() {
  return {
    chain: {
      id: env.MANTLE_CHAIN_ID,
      name: env.MANTLE_CHAIN_NAME,
      rpcUrl: env.MANTLE_RPC_URL,
      explorerUrl: env.MANTLE_EXPLORER_URL,
    },
    operator: {
      address: operatorAccount.address,
      writeApiKeyProtected: Boolean(env.WRITE_API_KEY),
      demoMintEnabled: env.ENABLE_DEMO_MINT,
    },
    core: {
      vault: contractAddresses.vault,
      exchange: contractAddresses.exchange,
      agentRegistry: contractAddresses.agentRegistry,
      strategyRegistry: contractAddresses.strategyRegistry,
      agentId: env.AGENT_ID,
    },
    assets: assetDefinitions.map((asset) => ({
      key: asset.key,
      displayName: asset.displayName,
      symbol: asset.symbol,
      address: asset.address,
      defaultAdapterKey: asset.defaultAdapterKey,
    })),
    adapters: Array.from(adapterDefinitionByKey.values()).map((adapter) => ({
      key: adapter.key,
      displayName: adapter.displayName,
      venueLabel: adapter.venueLabel,
      address: adapter.address,
      assetKey: adapter.assetKey,
    })),
  };
}

export async function getVaultSnapshot() {
  const [owner, authorizedAgent, currentRiskProfile, paused, totalPortfolioValueE18, trackedAssets, agentId] =
    (await publicClient.multicall({
      allowFailure: false,
      contracts: [
        {
          address: contractAddresses.vault,
          abi: vaultAbi,
          functionName: "owner",
        },
        {
          address: contractAddresses.vault,
          abi: vaultAbi,
          functionName: "authorizedAgent",
        },
        {
          address: contractAddresses.vault,
          abi: vaultAbi,
          functionName: "currentRiskProfile",
        },
        {
          address: contractAddresses.vault,
          abi: vaultAbi,
          functionName: "paused",
        },
        {
          address: contractAddresses.vault,
          abi: vaultAbi,
          functionName: "totalPortfolioValueE18",
        },
        {
          address: contractAddresses.vault,
          abi: vaultAbi,
          functionName: "getTrackedAssets",
        },
        {
          address: contractAddresses.vault,
          abi: vaultAbi,
          functionName: "agentId",
        },
      ],
    })) as [Address, Address, number, boolean, bigint, Address[], bigint];

  return {
    address: contractAddresses.vault,
    owner,
    authorizedAgent,
    paused,
    currentRiskProfileCode: Number(currentRiskProfile),
    currentRiskProfile: toEnumLabel(Number(currentRiskProfile), riskProfileNames),
    agentId: Number(agentId),
    totalPortfolioValueE18: totalPortfolioValueE18.toString(),
    totalPortfolioValueFormatted: formatFixedE18(totalPortfolioValueE18),
    trackedAssets,
  };
}

export async function getPortfolioSnapshot() {
  const vault = await getVaultSnapshot();
  const totalPortfolioValueE18 = BigInt(vault.totalPortfolioValueE18);
  const metadataContracts = [];
  const assetContracts = [];
  const strategyContracts = [];

  for (const asset of assetDefinitions) {
    const adapter = defaultAdapterForAsset(asset);

    metadataContracts.push(
      {
        address: asset.address,
        abi: tokenAbi,
        functionName: "name" as const,
      },
      {
        address: asset.address,
        abi: tokenAbi,
        functionName: "symbol" as const,
      },
      {
        address: asset.address,
        abi: tokenAbi,
        functionName: "decimals" as const,
      },
    );

    assetContracts.push(
      {
        address: contractAddresses.vault,
        abi: vaultAbi,
        functionName: "getAssetPolicy" as const,
        args: [asset.address],
      },
      {
        address: contractAddresses.vault,
        abi: vaultAbi,
        functionName: "getAssetTargetWeight" as const,
        args: [asset.address],
      },
      {
        address: asset.address,
        abi: tokenAbi,
        functionName: "balanceOf" as const,
        args: [contractAddresses.vault],
      },
      {
        address: contractAddresses.vault,
        abi: vaultAbi,
        functionName: "getCurrentAssetExposure" as const,
        args: [asset.address],
      },
      {
        address: contractAddresses.exchange,
        abi: exchangeAbi,
        functionName: "assetPriceE18" as const,
        args: [asset.address],
      },
      {
        address: contractAddresses.strategyRegistry,
        abi: strategyRegistryAbi,
        functionName: "isStrategyApproved" as const,
        args: [asset.address, adapter.address],
      },
    );

    strategyContracts.push(
      {
        address: adapter.address,
        abi: strategyAdapterAbi,
        functionName: "venueType" as const,
      },
      {
        address: adapter.address,
        abi: strategyAdapterAbi,
        functionName: "totalManagedAssets" as const,
      },
      {
        address: adapter.address,
        abi: strategyAdapterAbi,
        functionName: "maxWithdraw" as const,
        args: [contractAddresses.vault],
      },
      {
        address: adapter.address,
        abi: strategyAdapterAbi,
        functionName: "balanceOf" as const,
        args: [contractAddresses.vault],
      },
      {
        address: adapter.address,
        abi: strategyAdapterAbi,
        functionName: "latestSnapshot" as const,
      },
      {
        address: contractAddresses.vault,
        abi: vaultAbi,
        functionName: "getStrategyTargetWeight" as const,
        args: [asset.address, adapter.address],
      },
    );
  }

  const metadataResults = (await publicClient.multicall({
    allowFailure: false,
    contracts: metadataContracts,
  })) as Array<string | number>;

  const assetResults = (await publicClient.multicall({
    allowFailure: false,
    contracts: assetContracts,
  })) as Array<VaultAssetPolicy | number | bigint | boolean>;

  const strategyResults = (await publicClient.multicall({
    allowFailure: false,
    contracts: strategyContracts,
  })) as Array<number | bigint | AdapterSnapshot>;

  const assets = [];
  let metadataOffset = 0;
  let assetOffset = 0;
  let strategyOffset = 0;

  for (const asset of assetDefinitions) {
    const adapter = defaultAdapterForAsset(asset);
    const name = metadataResults[metadataOffset++] as string;
    const symbol = metadataResults[metadataOffset++] as string;
    const decimals = Number(metadataResults[metadataOffset++] as number);

    const policy = assetResults[assetOffset++] as VaultAssetPolicy;
    const targetWeightBps = Number(assetResults[assetOffset++] as number);
    const idleBalance = assetResults[assetOffset++] as bigint;
    const totalExposure = assetResults[assetOffset++] as bigint;
    const priceE18 = assetResults[assetOffset++] as bigint;
    const isStrategyApproved = Boolean(assetResults[assetOffset++]);

    const venueType = Number(strategyResults[strategyOffset++] as number);
    const totalManagedAssets = strategyResults[strategyOffset++] as bigint;
    const vaultWithdrawable = strategyResults[strategyOffset++] as bigint;
    const vaultShares = strategyResults[strategyOffset++] as bigint;
    const snapshot = strategyResults[strategyOffset++] as AdapterSnapshot;
    const strategyTargetWeight = Number(strategyResults[strategyOffset++] as number);

    const assetValueE18 = (totalExposure * priceE18) / 10n ** 18n;
    const strategyValueE18 = (totalManagedAssets * priceE18) / 10n ** 18n;

    assets.push({
      key: asset.key,
      displayName: name,
      symbol,
      configuredLabel: asset.displayName,
      address: asset.address,
      decimals,
      priceE18: priceE18.toString(),
      priceFormatted: formatFixedE18(priceE18),
      idleBalance: idleBalance.toString(),
      idleBalanceFormatted: formatTokenAmount(idleBalance, decimals),
      totalExposure: totalExposure.toString(),
      totalExposureFormatted: formatTokenAmount(totalExposure, decimals),
      assetValueE18: assetValueE18.toString(),
      assetValueFormatted: formatFixedE18(assetValueE18),
      currentWeightBps: weightFromValue(assetValueE18, totalPortfolioValueE18),
      targetWeightBps,
      policy: {
        enabled: policy.enabled,
        riskTier: Number(policy.riskTier),
        maxAllocationBps: {
          conservative: Number(policy.maxAllocationBps[0]),
          balanced: Number(policy.maxAllocationBps[1]),
          aggressive: Number(policy.maxAllocationBps[2]),
        },
      },
      strategies: [
        {
          key: adapter.key,
          label: adapter.displayName,
          venueLabel: adapter.venueLabel,
          address: adapter.address,
          approved: isStrategyApproved,
          venueTypeCode: venueType,
          venueType: toEnumLabel(venueType, venueTypeNames),
          totalManagedAssets: totalManagedAssets.toString(),
          totalManagedAssetsFormatted: formatTokenAmount(totalManagedAssets, decimals),
          vaultWithdrawable: vaultWithdrawable.toString(),
          vaultWithdrawableFormatted: formatTokenAmount(vaultWithdrawable, decimals),
          vaultShares: vaultShares.toString(),
          targetWeightBps: strategyTargetWeight,
          currentWeightBps: weightFromValue(strategyValueE18, totalPortfolioValueE18),
          latestSnapshot: {
            apyBps: Number(snapshot.apyBps),
            riskScore: Number(snapshot.riskScore),
            liquidityScore: Number(snapshot.liquidityScore),
            sourceTimestamp: Number(snapshot.sourceTimestamp),
            sourceHash: snapshot.sourceHash,
          },
        },
      ],
    });
  }

  return {
    vault,
    assets,
    updatedAt: new Date().toISOString(),
  };
}

export async function getMarketSnapshot() {
  const portfolio = await getPortfolioSnapshot();

  return {
    prices: portfolio.assets.map((asset) => ({
      assetKey: asset.key,
      address: asset.address,
      symbol: asset.symbol,
      priceE18: asset.priceE18,
      priceFormatted: asset.priceFormatted,
    })),
    adapters: portfolio.assets.flatMap((asset) =>
      asset.strategies.map((strategy) => ({
        assetKey: asset.key,
        adapterKey: strategy.key,
        address: strategy.address,
        venueType: strategy.venueType,
        latestSnapshot: strategy.latestSnapshot,
      })),
    ),
    updatedAt: portfolio.updatedAt,
  };
}

export async function getAgentSnapshot(agentId: number, decisionLimit = 10) {
  const [exists, stats, decisionCount] = await Promise.all([
    publicClient.multicall({
      allowFailure: false,
      contracts: [
        {
          address: contractAddresses.agentRegistry,
          abi: agentRegistryAbi,
          functionName: "exists",
          args: [BigInt(agentId)],
        },
        {
          address: contractAddresses.agentRegistry,
          abi: agentRegistryAbi,
          functionName: "getAgentStats",
          args: [BigInt(agentId)],
        },
        {
          address: contractAddresses.agentRegistry,
          abi: agentRegistryAbi,
          functionName: "getDecisionCount",
          args: [BigInt(agentId)],
        },
      ],
    }),
  ]).then(([results]) => results as [boolean, AgentStatsResult, bigint]);

  if (!exists) {
    throw new AppError(404, `Agent ${agentId} does not exist`);
  }

  const count = Number(decisionCount);
  const startIndex = Math.max(0, count - Math.max(0, decisionLimit));
  const indexes = Array.from({ length: count - startIndex }, (_, index) => startIndex + index);
  const decisions = indexes.length === 0
    ? []
    : ((await publicClient.multicall({
        allowFailure: false,
        contracts: indexes.map((index) => ({
          address: contractAddresses.agentRegistry,
          abi: agentRegistryAbi,
          functionName: "getDecision",
          args: [BigInt(agentId), BigInt(index)],
        })),
      })) as DecisionResult[]);

  return {
    agentId,
    stats: {
      totalDecisions: Number(stats.totalDecisions),
      successfulDecisions: Number(stats.successfulDecisions),
      blockedDecisions: Number(stats.blockedDecisions),
      lastDecisionAt: Number(stats.lastDecisionAt),
      cumulativePerformanceBps: stats.cumulativePerformanceBps.toString(),
      reputationScore: Number(stats.reputationScore),
    },
    decisionCount: count,
    decisions: decisions
      .map((decision, index) => ({
        index: indexes[index],
        reasoningHash: decision.reasoningHash,
        performanceBps: decision.performanceBps.toString(),
        timestamp: Number(decision.timestamp),
        blockedByGuardrail: decision.blockedByGuardrail,
        detailsURI: decision.detailsURI,
      }))
      .reverse(),
  };
}

export async function previewRebalance(inputTargets: StrategyTargetInput[]) {
  const normalizedTargets = normalizeTargets(inputTargets);
  const preview = (await publicClient.readContract({
    address: contractAddresses.vault,
    abi: vaultAbi,
    functionName: "previewRebalance",
    args: [normalizedTargets],
  })) as PreviewResult;

  return {
    targets: normalizedTargets,
    preview: serializePreviewResult(preview),
  };
}

export async function executeRebalance(parameters: {
  targets: StrategyTargetInput[];
  reasoning?: unknown;
  reasoningHash?: string;
  detailsUri?: string;
}) {
  const normalizedTargets = normalizeTargets(parameters.targets);
  const reasoningHash = normalizeHash(parameters.reasoningHash, parameters.reasoning);
  const preview = (await publicClient.readContract({
    address: contractAddresses.vault,
    abi: vaultAbi,
    functionName: "previewRebalance",
    args: [normalizedTargets],
  })) as PreviewResult;

  const serializedPreview = serializePreviewResult(preview);
  if (!serializedPreview.ok) {
    throw new AppError(409, "Rebalance preview rejected by vault guardrails", serializedPreview);
  }

  const receipt = await writeContractAndWait({
    address: contractAddresses.vault,
    abi: vaultAbi,
    functionName: "executeRebalance",
    args: [normalizedTargets, reasoningHash, parameters.detailsUri ?? ""],
  });

  return {
    reasoningHash,
    targets: normalizedTargets,
    preview: serializedPreview,
    receipt,
  };
}

export async function recordRejectedDecision(parameters: {
  targets: StrategyTargetInput[];
  reasoning?: unknown;
  reasoningHash?: string;
  detailsUri?: string;
}) {
  const normalizedTargets = normalizeTargets(parameters.targets);
  const reasoningHash = normalizeHash(parameters.reasoningHash, parameters.reasoning);
  const preview = (await publicClient.readContract({
    address: contractAddresses.vault,
    abi: vaultAbi,
    functionName: "previewRebalance",
    args: [normalizedTargets],
  })) as PreviewResult;

  const serializedPreview = serializePreviewResult(preview);
  if (serializedPreview.ok) {
    throw new AppError(409, "Preview is valid, rejected decision cannot be recorded", serializedPreview);
  }

  const receipt = await writeContractAndWait({
    address: contractAddresses.vault,
    abi: vaultAbi,
    functionName: "recordRejectedDecision",
    args: [normalizedTargets, reasoningHash, parameters.detailsUri ?? ""],
  });

  return {
    reasoningHash,
    targets: normalizedTargets,
    preview: serializedPreview,
    receipt,
  };
}

export async function updateMarketSnapshots(updates: SnapshotUpdateInput[]) {
  const receipts = [];

  for (const update of updates) {
    const adapter = resolveAdapterDefinition(update.adapter);
    const sourceTimestamp = update.sourceTimestamp ?? Math.floor(Date.now() / 1_000);
    const sourceHash = normalizeSourceHash(update.sourceHash, update.sourceLabel, update);

    const receipt = await writeContractAndWait({
      address: adapter.address,
      abi: baseAdapterAbi,
      functionName: "setMarketSnapshot",
      args: [update.apyBps, update.riskScore, update.liquidityScore, sourceTimestamp, sourceHash],
    });

    receipts.push({
      adapterKey: adapter.key,
      adapterAddress: adapter.address,
      receipt,
    });
  }

  return {
    updated: receipts.length,
    receipts,
  };
}

export async function updateMarketPrices(updates: PriceUpdateInput[]) {
  const receipts = [];

  for (const update of updates) {
    const asset = resolveAssetDefinition(update.asset);
    const normalizedPriceE18 = update.priceE18
      ? BigInt(update.priceE18)
      : update.price
        ? parseUnits(update.price, 18)
        : null;

    if (normalizedPriceE18 === null) {
      throw new AppError(400, `Price update for asset ${asset.key} requires price or priceE18`);
    }

    const receipt = await writeContractAndWait({
      address: contractAddresses.exchange,
      abi: exchangeAbi,
      functionName: "setAssetPrice",
      args: [asset.address, normalizedPriceE18],
    });

    receipts.push({
      assetKey: asset.key,
      assetAddress: asset.address,
      priceE18: normalizedPriceE18.toString(),
      priceFormatted: formatUnits(normalizedPriceE18, 18),
      receipt,
    });
  }

  return {
    updated: receipts.length,
    receipts,
  };
}

export async function mintDemoAsset(input: DemoMintInput) {
  if (!env.ENABLE_DEMO_MINT) {
    throw new AppError(403, "Demo mint endpoint is disabled");
  }
  if (!isAddress(input.recipient)) {
    throw new AppError(400, "Recipient must be a valid EVM address");
  }

  const asset = resolveAssetDefinition(input.asset);
  const tokenMeta = await getTokenMetadata(asset.address);
  const normalizedAmount = input.amountRaw
    ? BigInt(input.amountRaw)
    : input.amount
      ? parseUnits(input.amount, tokenMeta.decimals)
      : null;

  if (normalizedAmount === null) {
    throw new AppError(400, "Mint request requires amount or amountRaw");
  }

  const receipt = await writeContractAndWait({
    address: asset.address,
    abi: tokenAbi,
    functionName: "mint",
    args: [input.recipient, normalizedAmount],
  });

  return {
    assetKey: asset.key,
    assetAddress: asset.address,
    recipient: input.recipient,
    amount: normalizedAmount.toString(),
    amountFormatted: formatTokenAmount(normalizedAmount, tokenMeta.decimals),
    receipt,
  };
}
