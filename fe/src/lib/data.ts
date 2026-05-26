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
  let v = 0.5;
  let s = seed;
  for (let i = 0; i < len; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280 - 0.5;
    v = Math.max(0.08, Math.min(0.92, v + r * vol));
    out.push(v);
  }
  return out;
}

export const ASSETS: Asset[] = [
  {
    id: 'mETH',
    name: 'Mantle Staked ETH',
    sym: 'mETH',
    kind: 'Liquid Staking',
    color: 'oklch(0.82 0.14 165)',
    apy: 4.31,
    price: 3842.1,
    delta24: 1.84,
    weight: 0.34,
    balance: 18.642,
    venue: 'Aave V3 (Mantle)',
    venueKind: 'DeFi',
  },
  {
    id: 'USDY',
    name: 'Ondo US Dollar Yield',
    sym: 'USDY',
    kind: 'RWA · T-Bill',
    color: 'oklch(0.78 0.12 245)',
    apy: 5.12,
    price: 1.0832,
    delta24: 0.04,
    weight: 0.38,
    balance: 64210.55,
    venue: 'Ondo Vault',
    venueKind: 'RWA',
  },
  {
    id: 'fBTC',
    name: 'Function Bitcoin',
    sym: 'fBTC',
    kind: 'BTC Exposure',
    color: 'oklch(0.78 0.13 55)',
    apy: 2.86,
    price: 71204.3,
    delta24: -0.72,
    weight: 0.18,
    balance: 0.4612,
    venue: 'CIAN Vaults',
    venueKind: 'DeFi',
  },
  {
    id: 'MI4',
    name: 'Mantle Index 4',
    sym: 'MI4',
    kind: 'Index',
    color: 'oklch(0.74 0.14 295)',
    apy: 6.74,
    price: 102.41,
    delta24: 2.61,
    weight: 0.1,
    balance: 88.32,
    venue: 'Mantle Treasury',
    venueKind: 'DeFi',
  },
];

ASSETS.forEach((a, i) => {
  a.spark = genSpark((i + 1) * 137, 60, 0.18);
});

export const PORTFOLIO_SERIES = (() => {
  const days = 30;
  const out: { t: number; v: number }[] = [];
  let v = 145200;
  let s = 17;
  for (let i = 0; i <= days; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280 - 0.45;
    v = v * (1 + r * 0.012 + 0.0014);
    out.push({ t: i, v: Math.round(v * 100) / 100 });
  }
  return out;
})();

export const RISK_PROFILES: RiskProfiles = {
  Conservative: {
    label: 'Conservative',
    blurb: 'Capital preservation. Bias toward RWAs and staking.',
    max: { mETH: 0.3, USDY: 0.7, fBTC: 0.1, MI4: 0.1 },
    target: { mETH: 0.2, USDY: 0.6, fBTC: 0.1, MI4: 0.1 },
    drawdown: '≤ 2.0%',
    minApy: '4.2%',
  },
  Balanced: {
    label: 'Balanced',
    blurb: 'Diversified yield across RWA, staking, BTC and index.',
    max: { mETH: 0.45, USDY: 0.55, fBTC: 0.25, MI4: 0.2 },
    target: { mETH: 0.34, USDY: 0.38, fBTC: 0.18, MI4: 0.1 },
    drawdown: '≤ 4.5%',
    minApy: '4.8%',
  },
  Aggressive: {
    label: 'Aggressive',
    blurb: 'Yield maximization. Higher BTC / index exposure permitted.',
    max: { mETH: 0.55, USDY: 0.4, fBTC: 0.4, MI4: 0.4 },
    target: { mETH: 0.38, USDY: 0.2, fBTC: 0.28, MI4: 0.14 },
    drawdown: '≤ 8.0%',
    minApy: '5.5%',
  },
};

export const VENUES: Venue[] = [
  { name: 'Aave V3', kind: 'DeFi', chain: 'Mantle', asset: 'mETH', apy: 4.31, tvl: '$182M', state: 'active' },
  { name: 'CIAN Vaults', kind: 'DeFi', chain: 'Mantle', asset: 'fBTC', apy: 2.86, tvl: '$41M', state: 'active' },
  { name: 'Ondo USDY', kind: 'RWA', chain: 'Mantle', asset: 'USDY', apy: 5.12, tvl: '$612M', state: 'active' },
  { name: 'Mantle Treasury', kind: 'DeFi', chain: 'Mantle', asset: 'MI4', apy: 6.74, tvl: '$28M', state: 'active' },
  { name: 'Bybit Earn — Flexible', kind: 'CeFi', chain: 'Bybit', asset: 'USDY', apy: 4.1, tvl: '—', state: 'available' },
  { name: 'Bybit Earn — Fixed 14d', kind: 'CeFi', chain: 'Bybit', asset: 'mETH', apy: 4.82, tvl: '—', state: 'available' },
];

export const AGENTS: Agent[] = [
  {
    id: 9134,
    name: 'Equinox Prime',
    score: 91,
    badge: 'Apex',
    apy30: 5.84,
    apy90: 5.21,
    sharpe: 2.14,
    maxDD: 1.9,
    wins: 84,
    losses: 9,
    decisions: 412,
    inception: '2025-09-04',
    portfolio: 162840,
    profile: 'Balanced',
    isYou: true,
  },
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
    body: 'Mantle staking incentives lifted realized mETH APR to 4.31% versus USDY 4.92% net of gas. Within Balanced caps, shifting 4.2% reduces duration drag without breaching the 45% mETH ceiling.',
    venue: 'Aave V3 · Mantle',
    delta: '+4.20% mETH / −4.20% USDY',
    tx: '0x9a2c…f4b1',
  },
  {
    kind: 'scan',
    title: 'Yield curve scan complete',
    body: 'Evaluated 18 venues across DeFi and Bybit CeFi Earn. No rate differential exceeded 60 bps after gas — holding current allocation.',
    venue: 'Quant Engine',
    delta: 'no action',
    tx: null,
  },
  {
    kind: 'bridge',
    title: 'Routed mETH to Bybit Earn (Fixed 14d)',
    body: 'On-chain mETH APY compressed to 3.21%; Bybit Earn Fixed 14d offers 4.82% with $1.4M ceiling. Gas-aware bridge cost 0.32 bps; net pickup 158 bps.',
    venue: 'Bybit Earn',
    delta: '−6.0% mETH on-chain → CeFi',
    tx: '0x4c81…71d0',
  },
  {
    kind: 'guard',
    title: 'Transaction reverted — risk profile guard',
    body: 'Proposed reallocation would push fBTC exposure to 38.0%, exceeding the Balanced ceiling of 25%. Transaction was reverted on-chain by MantleVaultOrchestrator.',
    venue: 'Risk Guardrail',
    delta: 'blocked',
    tx: '0x7e10…9c44',
  },
  {
    kind: 'rebalance',
    title: 'Trimmed fBTC −2.1% into USDY',
    body: 'BTC 7-day realized volatility expanded 23%. To preserve Sharpe inside Balanced, trimmed fBTC by 2.1% and rotated into USDY for duration ballast.',
    venue: 'CIAN Vault → Ondo',
    delta: '−2.10% fBTC / +2.10% USDY',
    tx: '0x1b03…aa9e',
  },
  {
    kind: 'scan',
    title: 'Volatility regime change detected',
    body: 'Mantle DEX flow data points to elevated mETH/USDe vol over the next 24h. Increasing rebalance cadence from 6h to 2h and tightening fBTC ceiling by 200 bps internally.',
    venue: 'Quant Engine',
    delta: 'regime · ELEVATED',
    tx: null,
  },
  {
    kind: 'rebalance',
    title: 'Compounded MI4 rewards',
    body: 'MI4 emissions accrued $128.40 since last sweep. Auto-compounded back into the index; gas cost 0.04% of harvested rewards.',
    venue: 'Mantle Treasury',
    delta: '+$128.40 MI4',
    tx: '0x2dd0…3e75',
  },
];

export function nowStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function seedFeedV2(): FeedEntry[] {
  const lib = FEED_LIBRARY;
  const order = [0, 1, 4, 6, 2, 5, 1, 0];
  const out: FeedEntry[] = [];
  let key = 0;
  const now = Date.now();
  order.forEach((i, idx) => {
    const e = { ...lib[i] };
    e._key = ++key;
    const d = new Date(now - (idx + 1) * 90 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    e.timestamp = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    out.push(e);
  });
  return out;
}
