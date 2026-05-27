import type { Address } from 'viem';

import type { Agent, Asset, FeedEntry, RiskProfileName, Venue } from './data';
import type { AgentSnapshotResponse, ContractsResponse, PortfolioResponse, PreviewResponse } from './equinox-types';

const assetMeta: Record<string, { kind: string; color: string; fallbackPrice: number }> = {
  USDY: { kind: 'RWA · T-Bill', color: 'oklch(0.78 0.12 245)', fallbackPrice: 1 },
  mETH: { kind: 'Liquid Staking', color: 'oklch(0.82 0.14 165)', fallbackPrice: 3200 },
  fBTC: { kind: 'BTC Exposure', color: 'oklch(0.78 0.13 55)', fallbackPrice: 68000 },
  MI4: { kind: 'Index', color: 'oklch(0.74 0.14 295)', fallbackPrice: 100 },
};

export const profileCodes: Record<RiskProfileName, number> = {
  Conservative: 0,
  Balanced: 1,
  Aggressive: 2,
};

function numberOrFallback(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function shortHash(value: string, start = 6, end = 4) {
  if (!value || value.length <= start + end + 2) {
    return value;
  }

  return `${value.slice(0, start)}…${value.slice(-end)}`;
}

export function walletLabel(address?: string | null) {
  if (!address) {
    return 'Not connected';
  }

  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function isAddressEqual(left?: string | null, right?: string | null) {
  if (!left || !right) {
    return false;
  }

  return left.toLowerCase() === right.toLowerCase();
}

export function buildUiAssets(portfolio: PortfolioResponse): Asset[] {
  return portfolio.assets.map((asset) => {
    const meta = assetMeta[asset.key] || assetMeta.USDY;
    const primaryStrategy = asset.strategies[0];
    const price = numberOrFallback(asset.priceFormatted, meta.fallbackPrice);
    const balance = numberOrFallback(asset.totalExposureFormatted, 0);

    return {
      id: asset.key,
      name: asset.displayName,
      sym: asset.symbol,
      kind: meta.kind,
      color: meta.color,
      apy: (primaryStrategy?.latestSnapshot.apyBps || 0) / 100,
      price,
      delta24: 0,
      weight: asset.currentWeightBps / 10_000,
      balance,
      venue: primaryStrategy?.label || 'Strategy Adapter',
      venueKind: primaryStrategy?.venueLabel || 'DeFi',
    };
  });
}

export function buildUiVenues(portfolio: PortfolioResponse): Venue[] {
  const activeVenues = portfolio.assets.map((asset) => {
    const primaryStrategy = asset.strategies[0];

    return {
      name: primaryStrategy?.label || `${asset.symbol} Strategy`,
      kind: primaryStrategy?.venueLabel || 'DeFi',
      chain: 'Mantle',
      asset: asset.symbol,
      apy: (primaryStrategy?.latestSnapshot.apyBps || 0) / 100,
      tvl: `$${Math.round(numberOrFallback(asset.assetValueFormatted, 0)).toLocaleString()}`,
      state: 'active' as const,
    };
  });

  return [
    ...activeVenues,
    { name: 'Bybit Earn - Flexible', kind: 'CeFi', chain: 'Bybit', asset: 'USDY', apy: 4.1, tvl: '-', state: 'available' },
    { name: 'Bybit Earn - Fixed 14d', kind: 'CeFi', chain: 'Bybit', asset: 'mETH', apy: 4.82, tvl: '-', state: 'available' },
  ];
}

export function buildPrimaryAgent(
  agentSnapshot: AgentSnapshotResponse,
  portfolio: PortfolioResponse,
  profile: RiskProfileName,
): Agent {
  const totalValue = numberOrFallback(portfolio.vault.totalPortfolioValueFormatted, 0);
  const weightedApy = buildUiAssets(portfolio).reduce((sum, asset) => sum + asset.weight * asset.apy, 0);

  return {
    id: agentSnapshot.agentId,
    name: 'Equinox Prime',
    score: agentSnapshot.stats.reputationScore,
    badge: 'Verified',
    apy30: weightedApy,
    apy90: weightedApy * 0.96,
    sharpe: Math.max(1.1, weightedApy / 2.3),
    maxDD: profile === 'Conservative' ? 1.9 : profile === 'Balanced' ? 4.2 : 7.1,
    wins: agentSnapshot.stats.successfulDecisions,
    losses: agentSnapshot.stats.blockedDecisions,
    decisions: agentSnapshot.stats.totalDecisions,
    inception: new Date(Math.max(agentSnapshot.stats.lastDecisionAt * 1000, Date.now() - 45 * 24 * 60 * 60 * 1000))
      .toISOString()
      .slice(0, 10),
    portfolio: totalValue,
    profile,
    isYou: true,
  };
}

export function buildDecisionFeed(agentSnapshot: AgentSnapshotResponse): FeedEntry[] {
  return agentSnapshot.decisions.map((decision) => {
    const timestamp = new Date(decision.timestamp * 1000);
    const shortReasoning = shortHash(decision.reasoningHash, 10, 6);

    return {
      _key: decision.index,
      kind: decision.blockedByGuardrail ? 'guard' : 'rebalance',
      title: decision.blockedByGuardrail ? 'Vault guardrail blocked a rebalance' : 'Authorized agent executed a rebalance',
      body: decision.detailsURI
        ? `Reasoning context: ${decision.detailsURI}`
        : `Reasoning hash ${shortReasoning} is recorded on-chain for audit.`,
      venue: decision.blockedByGuardrail ? 'Risk Guardrail' : 'MantleVaultOrchestrator',
      delta: decision.blockedByGuardrail ? 'blocked' : `${Number(decision.performanceBps) / 100}% perf`,
      tx: decision.reasoningHash,
      timestamp: timestamp.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      ago: 'live',
    };
  });
}

export function buildProfileTargets(contracts: ContractsResponse, targetMap: Record<string, number>) {
  return contracts.assets.map((asset) => ({
    asset: asset.key,
    adapter: asset.defaultAdapterKey,
    weightBps: Math.round((targetMap[asset.key] || 0) * 10_000),
  }));
}

export function buildBlockedTargets(contracts: ContractsResponse) {
  const defaults: Record<string, number> = {
    USDY: 2_800,
    mETH: 2_400,
    fBTC: 3_800,
    MI4: 1_000,
  };

  return contracts.assets.map((asset) => ({
    asset: asset.key,
    adapter: asset.defaultAdapterKey,
    weightBps: defaults[asset.key] || 0,
  }));
}

export function buildPreviewFeed(preview: PreviewResponse, profile: RiskProfileName): FeedEntry {
  return {
    _key: Date.now(),
    kind: preview.preview.ok ? 'scan' : 'guard',
    title: preview.preview.ok ? `Preview accepted for ${profile}` : `Preview rejected: ${preview.preview.reason}`,
    body: preview.preview.ok
      ? `Vault accepted the requested ${profile} allocation with total weight ${preview.preview.totalWeightBps} bps.`
      : `${preview.preview.reason} on ${preview.preview.offendingAssetKey || shortHash(preview.preview.offendingAsset)}.`,
    venue: 'Backend preview',
    delta: preview.preview.ok ? 'preview ok' : 'blocked',
    tx: null,
    timestamp: new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    ago: 'just now',
  };
}

export function assetAddressForKey(contracts: ContractsResponse, key: string): Address | undefined {
  return contracts.assets.find((asset) => asset.key === key)?.address as Address | undefined;
}
