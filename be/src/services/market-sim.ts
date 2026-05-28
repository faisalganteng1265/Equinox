import { adapterDefinitions, assetDefinitions } from "../config/equinox.js";
import { logEvent } from "../lib/logger.js";
import { updateMarketPrices, updateMarketSnapshots } from "./equinox.js";

// ─── Fallback sine-wave simulation ───────────────────────────────────────────

interface AdapterBase {
  apyBps: number;
  apyRange: number;
  riskScore: number;
  riskRange: number;
  liquidityScore: number;
}

const ADAPTER_BASE: Record<string, AdapterBase> = {
  USDY_IDLE: { apyBps: 480,  apyRange: 60,  riskScore: 12, riskRange: 6,  liquidityScore: 95 },
  METH_DEFI: { apyBps: 400,  apyRange: 80,  riskScore: 28, riskRange: 8,  liquidityScore: 80 },
  FBTC_CEFI: { apyBps: 350,  apyRange: 100, riskScore: 35, riskRange: 6,  liquidityScore: 72 },
  MI4_DEFI:  { apyBps: 520,  apyRange: 120, riskScore: 30, riskRange: 8,  liquidityScore: 76 },
};

const ASSET_BASE: Record<string, { price: number; range: number }> = {
  USDY: { price: 1.00,     range: 0.005  },
  mETH: { price: 2500.0,   range: 80.0   },
  fBTC: { price: 98000.0,  range: 2000.0 },
  MI4:  { price: 110.0,    range: 5.0    },
};

function drift(seed: number, fast: number, slow: number): number {
  const t = Date.now();
  return Math.sin((t / fast + seed) * 2 * Math.PI) * 0.6 +
         Math.sin((t / slow + seed) * 2 * Math.PI) * 0.4;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ─── Real data fetchers ───────────────────────────────────────────────────────

// USDY → US Treasury 3-month T-Bill average interest rate
// Source: api.fiscaldata.treasury.gov (public, no auth required)
async function fetchUsdyApyBps(): Promise<number | null> {
  try {
    const url =
      "https://api.fiscaldata.treasury.gov/services/api/v1/accounting/od/avg_interest_rates" +
      "?fields=record_date,security_type_desc,avg_interest_rate_amt" +
      "&filter=security_type_desc:eq:Treasury Bills" +
      "&sort=-record_date&page[size]=1";

    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      data: Array<{ avg_interest_rate_amt: string }>;
    };

    const rate = parseFloat(json.data?.[0]?.avg_interest_rate_amt ?? "");
    if (!isFinite(rate) || rate <= 0) return null;

    // rate is in percent (e.g. 4.85), convert to BPS
    const apyBps = Math.round(rate * 100);
    logEvent("info", "market_data_usdy", { source: "treasury.gov", ratePct: rate, apyBps });
    return apyBps;
  } catch {
    return null;
  }
}

// mETH → Ethereum liquid staking APY from DeFiLlama
// Searches for the mETH (Mantle) pool or falls back to best ETH staking pool
async function fetchMethApyBps(): Promise<number | null> {
  try {
    const res = await fetch("https://yields.llama.fi/pools", {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      data: Array<{ symbol: string; project: string; apy: number; chain: string }>;
    };

    // Prefer mETH on Mantle, fall back to major ETH staking pools
    const candidates = json.data.filter(
      (p) =>
        (p.symbol?.toLowerCase().includes("meth") && p.chain?.toLowerCase() === "mantle") ||
        (p.project === "mantle-staking" && p.symbol?.toLowerCase().includes("meth")),
    );

    const fallbackEth = json.data.filter(
      (p) =>
        ["lido", "rocket-pool", "frax-ether"].includes(p.project) &&
        p.chain === "Ethereum" &&
        p.apy > 0 &&
        p.apy < 20,
    );

    const pool = candidates[0] ?? fallbackEth[0];
    if (!pool || !isFinite(pool.apy) || pool.apy <= 0) return null;

    const apyBps = Math.round(pool.apy * 100);
    logEvent("info", "market_data_meth", {
      source: "defillama",
      project: pool.project,
      apyPct: pool.apy,
      apyBps,
    });
    return apyBps;
  } catch {
    return null;
  }
}

// fBTC → Bybit Flexible Savings BTC earn rate (public endpoint)
async function fetchFbtcApyBps(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.bybit.com/v5/savings/product/list?category=FlexibleSaving&coin=BTC",
      { signal: AbortSignal.timeout(8_000) },
    );
    if (!res.ok) return null;

    const json = (await res.json()) as {
      retCode: number;
      result?: {
        list?: Array<{ annualRate: string }>;
      };
    };

    if (json.retCode !== 0) return null;

    const rate = parseFloat(json.result?.list?.[0]?.annualRate ?? "");
    if (!isFinite(rate) || rate <= 0) return null;

    // annualRate from Bybit is in decimal (e.g. 0.0368 = 3.68%)
    const apyBps = Math.round(rate * 10_000);
    logEvent("info", "market_data_fbtc", { source: "bybit", ratePct: rate * 100, apyBps });
    return apyBps;
  } catch {
    return null;
  }
}

// MI4 → Average APY of top Mantle DeFi pools from DeFiLlama
async function fetchMi4ApyBps(): Promise<number | null> {
  try {
    const res = await fetch("https://yields.llama.fi/pools", {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      data: Array<{ chain: string; apy: number; tvlUsd: number }>;
    };

    const mantlePools = json.data.filter(
      (p) =>
        p.chain?.toLowerCase() === "mantle" &&
        p.apy > 0 &&
        p.apy < 50 &&
        p.tvlUsd > 10_000,
    );

    if (mantlePools.length === 0) return null;

    // Use median APY of top Mantle pools as MI4 proxy
    const sorted = [...mantlePools].sort((a, b) => b.tvlUsd - a.tvlUsd).slice(0, 10);
    const avg = sorted.reduce((sum, p) => sum + p.apy, 0) / sorted.length;
    const apyBps = Math.round(avg * 100);
    logEvent("info", "market_data_mi4", { source: "defillama-mantle-avg", avgPct: avg, apyBps });
    return apyBps;
  } catch {
    return null;
  }
}

// ─── Snapshot + price builders ────────────────────────────────────────────────

async function buildSnapshotUpdates() {
  const [usdyApy, methApy, fbtcApy, mi4Apy] = await Promise.all([
    fetchUsdyApyBps(),
    fetchMethApyBps(),
    fetchFbtcApyBps(),
    fetchMi4ApyBps(),
  ]);

  return adapterDefinitions.flatMap((adapter) => {
    const base = ADAPTER_BASE[adapter.key];
    if (!base) return [];

    const seed = adapter.key.length;

    let apyBps: number;
    if (adapter.key === "USDY_IDLE" && usdyApy !== null) {
      apyBps = usdyApy;
    } else if (adapter.key === "METH_DEFI" && methApy !== null) {
      apyBps = methApy;
    } else if (adapter.key === "FBTC_CEFI" && fbtcApy !== null) {
      apyBps = fbtcApy;
    } else if (adapter.key === "MI4_DEFI" && mi4Apy !== null) {
      apyBps = mi4Apy;
    } else {
      // Fallback sine-wave
      const apyNoise = drift(seed, 7_200_000, 3_600_000);
      apyBps = Math.round(clamp(base.apyBps + apyNoise * base.apyRange, 50, 2000));
      logEvent("info", "market_data_fallback", { adapter: adapter.key });
    }

    const riskNoise = drift(seed * 7, 14_400_000, 7_200_000);
    // Cap at 39 so all profiles (Conservative ≤ 40) can always rebalance
    const riskScore = Math.round(clamp(base.riskScore + riskNoise * base.riskRange, 5, 39));

    return [{
      adapter: adapter.key,
      apyBps: clamp(apyBps, 50, 3000),
      riskScore,
      liquidityScore: base.liquidityScore,
      sourceLabel: "equinox-market-data",
    }];
  });
}

function buildPriceUpdates() {
  return assetDefinitions.flatMap((asset) => {
    const base = ASSET_BASE[asset.key];
    if (!base) return [];

    const seed = asset.key.length * 13;
    const noise = drift(seed, 5_400_000, 2_700_000);
    const price = clamp(base.price + noise * base.range, base.price * 0.95, base.price * 1.05);
    return [{ asset: asset.key, price: price.toFixed(6) }];
  });
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function refreshMarketData(): Promise<void> {
  logEvent("info", "market_sim_start", {});

  const [snapshotUpdates, priceUpdates] = await Promise.all([
    buildSnapshotUpdates(),
    Promise.resolve(buildPriceUpdates()),
  ]);

  try {
    await updateMarketSnapshots(snapshotUpdates);
    logEvent("info", "market_sim_snapshots_ok", { count: snapshotUpdates.length });
  } catch (error) {
    logEvent("warn", "market_sim_snapshots_error", { error: String(error) });
  }

  try {
    await updateMarketPrices(priceUpdates);
    logEvent("info", "market_sim_prices_ok", { count: priceUpdates.length });
  } catch (error) {
    logEvent("warn", "market_sim_prices_error", { error: String(error) });
  }

  logEvent("info", "market_sim_done", {});
}
