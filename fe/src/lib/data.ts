export interface Asset {
  id: string;
  name: string;
  sym: string;
  kind: string;
  color: string;
  apy: number;
  price: number;
  delta24: number;
  weight: number;
  balance: number;
  venue: string;
  venueKind: string;
  spark?: number[];
}

export interface Agent {
  id: number;
  name: string;
  score: number;
  badge: string;
  apy30: number;
  apy90: number;
  sharpe: number;
  maxDD: number;
  wins: number;
  losses: number;
  decisions: number;
  inception: string;
  portfolio: number;
  profile: string;
  isYou?: boolean;
}

export type FeedKind = 'rebalance' | 'scan' | 'bridge' | 'guard';

export interface FeedEntry {
  _key?: number;
  kind: FeedKind;
  title: string;
  body: string;
  venue: string;
  delta: string;
  tx: string | null;
  timestamp?: string;
  ago?: string;
}

export interface Venue {
  name: string;
  kind: string;
  chain: string;
  asset: string;
  apy: number;
  tvl: string;
  state: 'active' | 'available';
}

export interface RiskProfileConfig {
  label: string;
  blurb: string;
  max: Record<string, number>;
  target: Record<string, number>;
  drawdown: string;
  minApy: string;
}

export type RiskProfileName = 'Conservative' | 'Balanced' | 'Aggressive';
export type RiskProfiles = Record<RiskProfileName, RiskProfileConfig>;

function genSpark(seed: number, len = 48, vol = 0.12): number[] {
  const out: number[] = [];
  let value = 0.5;
  let state = seed;

  for (let i = 0; i < len; i++) {
    state = (state * 9301 + 49297) % 233280;
    const random = state / 233280 - 0.5;
    value = Math.max(0.08, Math.min(0.92, value + random * vol));
    out.push(value);
  }

  return out;
}

export const RISK_PROFILES: RiskProfiles = {
  Conservative: {
    label: 'Conservative',
    blurb: 'Capital preservation. Bias toward RWAs and staking.',
    max: { mETH: 0.3, USDY: 0.7, fBTC: 0.1, MI4: 0.1 },
    target: { mETH: 0.2, USDY: 0.6, fBTC: 0.1, MI4: 0.1 },
    drawdown: '<= 2.0%',
    minApy: '4.2%',
  },
  Balanced: {
    label: 'Balanced',
    blurb: 'Diversified yield across RWA, staking, BTC and index.',
    max: { mETH: 0.45, USDY: 0.55, fBTC: 0.25, MI4: 0.2 },
    target: { mETH: 0.34, USDY: 0.38, fBTC: 0.18, MI4: 0.1 },
    drawdown: '<= 4.5%',
    minApy: '4.8%',
  },
  Aggressive: {
    label: 'Aggressive',
    blurb: 'Yield maximization. Higher BTC and index exposure permitted.',
    max: { mETH: 0.55, USDY: 0.4, fBTC: 0.4, MI4: 0.4 },
    target: { mETH: 0.38, USDY: 0.2, fBTC: 0.28, MI4: 0.14 },
    drawdown: '<= 8.0%',
    minApy: '5.5%',
  },
};

export const STATIC_AGENTS: Agent[] = [
  {
    id: 8821,
    name: 'Athena Yield',
    score: 87,
    badge: 'Verified',
    apy30: 6.12,
    apy90: 5.04,
    sharpe: 1.92,
    maxDD: 2.6,
    wins: 71,
    losses: 12,
    decisions: 318,
    inception: '2025-07-21',
    portfolio: 4_280_000,
    profile: 'Balanced',
  },
  {
    id: 7407,
    name: 'Helios Stable',
    score: 82,
    badge: 'Verified',
    apy30: 4.71,
    apy90: 4.62,
    sharpe: 2.41,
    maxDD: 0.7,
    wins: 102,
    losses: 4,
    decisions: 504,
    inception: '2025-05-02',
    portfolio: 11_900_000,
    profile: 'Conservative',
  },
  {
    id: 6620,
    name: 'Aether Compounder',
    score: 76,
    badge: 'Verified',
    apy30: 7.92,
    apy90: 6.31,
    sharpe: 1.61,
    maxDD: 4.8,
    wins: 58,
    losses: 17,
    decisions: 271,
    inception: '2025-08-11',
    portfolio: 920_000,
    profile: 'Aggressive',
  },
];

export const FEED_LIBRARY: FeedEntry[] = [
  {
    kind: 'rebalance',
    title: 'Reweighted mETH +4.2% from USDY',
    body: 'Mantle staking incentives improved realized mETH APR versus idle USDY. The rebalance stayed inside Balanced caps while reducing cash drag.',
    venue: 'mETH Strategy Adapter',
    delta: '+4.20% mETH / -4.20% USDY',
    tx: '0x9a2c…f4b1',
  },
  {
    kind: 'scan',
    title: 'Yield curve scan complete',
    body: 'The backend compared strategy snapshots and kept the current allocation because no venue differential exceeded the configured threshold after gas.',
    venue: 'Quant Engine',
    delta: 'no action',
    tx: null,
  },
  {
    kind: 'bridge',
    title: 'CeFi route simulation settled',
    body: 'A mock CeFi route was simulated to show how Equinox can compare off-chain venues without giving up on-chain guardrails.',
    venue: 'Bybit route simulator',
    delta: 'route simulated',
    tx: null,
  },
  {
    kind: 'guard',
    title: 'Transaction reverted by risk guard',
    body: 'The requested allocation exceeded the profile cap and the vault refused to move funds.',
    venue: 'Risk Guardrail',
    delta: 'blocked',
    tx: '0x7e10…9c44',
  },
];

export function buildSparkSeries(assets: Asset[]) {
  return assets.map((asset, index) => ({
    ...asset,
    spark: genSpark((index + 1) * 137, 60, 0.18),
  }));
}

export function nowStamp(): string {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function seedFeedV2(): FeedEntry[] {
  const order = [0, 1, 3, 2, 1, 0];
  const out: FeedEntry[] = [];
  const now = Date.now();

  order.forEach((libraryIndex, index) => {
    const entry = { ...FEED_LIBRARY[libraryIndex] };
    const date = new Date(now - (index + 1) * 90 * 1000);
    const pad = (value: number) => String(value).padStart(2, '0');

    entry._key = index + 1;
    entry.timestamp = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    out.push(entry);
  });

  return out;
}
