import type {
  AgentSnapshotResponse,
  ContractsResponse,
  MarketResponse,
  PortfolioResponse,
  PreviewResponse,
  RebalanceWriteResponse,
} from './equinox-types';

const EQUINOX_API_ROOT = '/api/equinox';

interface ApiErrorPayload {
  error?: string;
  details?: unknown;
}

async function parseError(response: Response) {
  let payload: ApiErrorPayload | null = null;

  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = null;
  }

  const message = payload?.error || `Request failed with status ${response.status}`;
  const error = new Error(message) as Error & { details?: unknown; status?: number };
  error.details = payload?.details;
  error.status = response.status;
  throw error;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${EQUINOX_API_ROOT}/${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'content-type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    await parseError(response);
  }

  return (await response.json()) as T;
}

export const equinoxApi = {
  getContracts() {
    return apiRequest<ContractsResponse>('contracts');
  },
  getPortfolio() {
    return apiRequest<PortfolioResponse>('portfolio');
  },
  getMarket() {
    return apiRequest<MarketResponse>('market');
  },
  getAgent(agentId: number) {
    return apiRequest<AgentSnapshotResponse>(`agents/${agentId}`);
  },
  previewRebalance(payload: { targets: Array<{ asset: string; adapter?: string; weightBps: number }> }) {
    return apiRequest<PreviewResponse>('rebalance/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  executeRebalance(payload: {
    targets: Array<{ asset: string; adapter?: string; weightBps: number }>;
    reasoning?: unknown;
    reasoningHash?: string;
    detailsUri?: string;
  }) {
    return apiRequest<RebalanceWriteResponse>('rebalance/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  rejectRebalance(payload: {
    targets: Array<{ asset: string; adapter?: string; weightBps: number }>;
    reasoning?: unknown;
    reasoningHash?: string;
    detailsUri?: string;
  }) {
    return apiRequest<RebalanceWriteResponse>('rebalance/reject', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  mintDemoAsset(payload: {
    asset: string;
    recipient: string;
    amount?: string;
    amountRaw?: string;
  }) {
    return apiRequest<{
      assetKey: string;
      assetAddress: string;
      recipient: string;
      amount: string;
      amountFormatted: string;
      receipt: {
        transactionHash: string;
        blockNumber: string;
        gasUsed: string;
        status: string;
        explorerUrl: string;
      };
    }>('demo/mint', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  estimateMantleGas(payload: {
    txs: Array<{ to: string; data?: string; value?: string }>;
  }) {
    return apiRequest<{
      network: string;
      estimates: Array<{
        index: number;
        gasLimit: string;
        l1GasCostWei: string;
        l2GasCostWei: string;
        totalGasCostWei: string;
        totalGasCostEth: string;
      }>;
      totalGasCostWei: string;
      totalGasCostEth: string;
    }>('../mantle/gas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
