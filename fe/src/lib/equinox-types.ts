export interface ContractsResponse {
  chain: {
    id: number;
    name: string;
    rpcUrl: string;
    explorerUrl: string;
  };
  operator: {
    address: string;
    writeApiKeyProtected: boolean;
    demoMintEnabled: boolean;
  };
  core: {
    vault: string;
    vaultFactory: string | null;
    exchange: string;
    agentRegistry: string;
    strategyRegistry: string;
    agentId: number;
  };
  assets: Array<{
    key: string;
    displayName: string;
    symbol: string;
    address: string;
    defaultAdapterKey: string;
  }>;
  adapters: Array<{
    key: string;
    displayName: string;
    venueLabel: string;
    address: string;
    assetKey: string;
  }>;
}

export interface VaultAccountResponse {
  owner: string;
  factory: string;
  hasVault: boolean;
  vault: string | null;
  agentId: number | null;
}

export interface CreateVaultResponse extends VaultAccountResponse {
  created: boolean;
  receipt: null | {
    transactionHash: string;
    blockNumber: string;
    gasUsed: string;
    status: string;
    explorerUrl: string;
  };
}

export interface PortfolioResponse {
  vault: {
    address: string;
    owner: string;
    authorizedAgent: string;
    paused: boolean;
    currentRiskProfileCode: number;
    currentRiskProfile: 'Conservative' | 'Balanced' | 'Aggressive';
    agentId: number;
    totalPortfolioValueE18: string;
    totalPortfolioValueFormatted: string;
    trackedAssets: string[];
  };
  assets: Array<{
    key: string;
    displayName: string;
    symbol: string;
    configuredLabel: string;
    address: string;
    decimals: number;
    priceE18: string;
    priceFormatted: string;
    idleBalance: string;
    idleBalanceFormatted: string;
    totalExposure: string;
    totalExposureFormatted: string;
    assetValueE18: string;
    assetValueFormatted: string;
    currentWeightBps: number;
    targetWeightBps: number;
    policy: {
      enabled: boolean;
      riskTier: number;
      maxAllocationBps: {
        conservative: number;
        balanced: number;
        aggressive: number;
      };
    };
    strategies: Array<{
      key: string | null;
      label: string;
      venueLabel: string;
      address: string;
      approved: boolean;
      venueTypeCode: number;
      venueType: string;
      totalManagedAssets: string;
      totalManagedAssetsFormatted: string;
      vaultWithdrawable: string;
      vaultWithdrawableFormatted: string;
      vaultShares: string;
      targetWeightBps: number;
      currentWeightBps: number;
      latestSnapshot: {
        apyBps: number;
        riskScore: number;
        liquidityScore: number;
        sourceTimestamp: number;
        sourceHash: string;
      };
    }>;
  }>;
  updatedAt: string;
}

export interface MarketResponse {
  prices: Array<{
    assetKey: string;
    address: string;
    symbol: string;
    priceE18: string;
    priceFormatted: string;
  }>;
  adapters: Array<{
    assetKey: string;
    adapterKey: string | null;
    address: string;
    venueType: string;
    latestSnapshot: {
      apyBps: number;
      riskScore: number;
      liquidityScore: number;
      sourceTimestamp: number;
      sourceHash: string;
    };
  }>;
  updatedAt: string;
}

export interface AgentSnapshotResponse {
  agentId: number;
  stats: {
    totalDecisions: number;
    successfulDecisions: number;
    blockedDecisions: number;
    lastDecisionAt: number;
    cumulativePerformanceBps: string;
    reputationScore: number;
  };
  decisionCount: number;
  decisions: Array<{
    index: number;
    reasoningHash: string;
    performanceBps: string;
    timestamp: number;
    blockedByGuardrail: boolean;
    detailsURI: string;
  }>;
}

export interface PreviewResponse {
  targets: Array<{
    asset: string;
    assetKey: string;
    adapter: string;
    adapterKey: string;
    weightBps: number;
  }>;
  preview: {
    ok: boolean;
    reasonCode: number;
    reason: string;
    offendingAsset: string;
    offendingAssetKey: string | null;
    offendingAdapter: string;
    offendingAdapterKey: string | null;
    attemptedWeightBps: number;
    limitWeightBps: number;
    totalWeightBps: number;
  };
}

export interface RebalanceWriteResponse {
  reasoningHash: string;
  targets: PreviewResponse['targets'];
  preview: PreviewResponse['preview'];
  receipt: {
    transactionHash: string;
    blockNumber: string;
    gasUsed: string;
    status: string;
    explorerUrl: string;
  };
}
