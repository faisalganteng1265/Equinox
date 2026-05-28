import { riskProfileNames } from "../lib/format.js";
import type { ReasoningInput } from "./reasoning.js";

// Mirrors FE data.ts RISK_PROFILES — target weights per asset per profile
const PROFILE_TARGETS: Record<string, Record<string, number>> = {
  Conservative: { mETH: 0.20, USDY: 0.60, fBTC: 0.10, MI4: 0.10 },
  Balanced:     { mETH: 0.34, USDY: 0.38, fBTC: 0.18, MI4: 0.10 },
  Aggressive:   { mETH: 0.38, USDY: 0.20, fBTC: 0.28, MI4: 0.14 },
};

export interface StrategyTarget {
  asset: string;
  adapter?: string;
  weightBps: number;
}

export interface StrategyDecision {
  targets: StrategyTarget[];
  driftBps: number;
  reasoningInput: ReasoningInput;
  shouldExecute: boolean;
}

export function computeStrategy(
  vaultAddress: string,
  riskProfileCode: number,
  totalPortfolioValueFormatted: string,
  assets: Array<{
    key: string;
    symbol: string;
    currentWeightBps: number;
    strategies: Array<{
      key: string | null;
      latestSnapshot: { apyBps: number };
      venueLabel: string;
    }>;
  }>,
  driftThresholdBps: number,
): StrategyDecision {
  const profileName = riskProfileNames[riskProfileCode] ?? "Balanced";
  const profileTargets = PROFILE_TARGETS[profileName] ?? PROFILE_TARGETS["Balanced"]!;

  const targets: StrategyTarget[] = [];
  const allocationInfo: ReasoningInput["currentAllocation"] = [];
  let maxDriftBps = 0;

  for (const asset of assets) {
    const targetWeight = profileTargets[asset.key] ?? 0;
    const targetWeightBps = Math.round(targetWeight * 10000);
    const driftBps = Math.abs(targetWeightBps - asset.currentWeightBps);
    if (driftBps > maxDriftBps) maxDriftBps = driftBps;

    const primaryStrategy = asset.strategies[0];

    targets.push({
      asset: asset.key,
      adapter: primaryStrategy?.key ?? undefined,
      weightBps: targetWeightBps,
    });

    allocationInfo.push({
      asset: asset.key,
      symbol: asset.symbol,
      currentWeightPct: asset.currentWeightBps / 100,
      targetWeightPct: targetWeight * 100,
      apyBps: primaryStrategy?.latestSnapshot.apyBps ?? 0,
      venueLabel: primaryStrategy?.venueLabel ?? "Unknown",
    });
  }

  return {
    targets,
    driftBps: maxDriftBps,
    reasoningInput: {
      vaultAddress,
      riskProfile: profileName,
      totalPortfolioValue: totalPortfolioValueFormatted,
      currentAllocation: allocationInfo,
      proposedTargets: targets.map((t) => ({
        assetKey: t.asset,
        adapterKey: t.adapter ?? "",
        weightBps: t.weightBps,
      })),
      driftBps: maxDriftBps,
    },
    shouldExecute: maxDriftBps >= driftThresholdBps,
  };
}
