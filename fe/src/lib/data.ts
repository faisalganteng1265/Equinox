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
  txUrl?: string;
  timestamp?: string;
  occurredAt?: number;
  ago?: string;
}

export interface Venue {
  name: string;
  kind: string;
  chain: string;
  asset: string;
  assetAddress?: string;
  adapterAddress?: string;
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
