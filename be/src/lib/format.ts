import { formatUnits } from "viem";

export const riskProfileNames = ["Conservative", "Balanced", "Aggressive"] as const;
export const venueTypeNames = ["Idle", "DeFiLending", "CeFiEarn"] as const;
export const rebalanceReasonNames = [
  "None",
  "EmptyTargets",
  "UnsupportedAsset",
  "UnapprovedAdapter",
  "DuplicateTarget",
  "WeightSumMismatch",
  "AssetRiskLimitExceeded",
  "AdapterRiskTooHigh",
  "MissingPrice",
] as const;

function trimTrailingZeroes(value: string) {
  return value.replace(/\.?0+$/, "");
}

export function formatTokenAmount(value: bigint, decimals: number, maxFractionDigits = 6) {
  const formatted = formatUnits(value, decimals);
  const [whole, fraction = ""] = formatted.split(".");

  if (!fraction) {
    return whole;
  }

  return trimTrailingZeroes(`${whole}.${fraction.slice(0, maxFractionDigits)}`);
}

export function formatFixedE18(value: bigint, maxFractionDigits = 4) {
  return formatTokenAmount(value, 18, maxFractionDigits);
}

export function weightFromValue(valueE18: bigint, totalValueE18: bigint) {
  if (totalValueE18 === 0n) {
    return 0;
  }

  return Number((valueE18 * 10_000n) / totalValueE18);
}

export function toEnumLabel<T extends readonly string[]>(value: number, labels: T): T[number] | "Unknown" {
  return labels[value] ?? "Unknown";
}

