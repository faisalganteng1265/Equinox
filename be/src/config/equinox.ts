import type { Address } from "viem";

import { env } from "./env.js";

export type AssetKey = "USDY" | "mETH" | "fBTC" | "MI4";
export type AdapterKey = "USDY_IDLE" | "METH_DEFI" | "FBTC_CEFI" | "MI4_DEFI";

export interface AssetDefinition {
  key: AssetKey;
  displayName: string;
  symbol: string;
  address: Address;
  defaultAdapterKey: AdapterKey;
}

export interface AdapterDefinition {
  key: AdapterKey;
  displayName: string;
  venueLabel: string;
  address: Address;
  assetKey: AssetKey;
}

export const assetDefinitions: AssetDefinition[] = [
  {
    key: "USDY",
    displayName: "Mock USDY",
    symbol: "mUSDY",
    address: env.MOCK_USDY_ADDRESS,
    defaultAdapterKey: "USDY_IDLE",
  },
  {
    key: "mETH",
    displayName: "Mock mETH",
    symbol: "mmETH",
    address: env.MOCK_METH_ADDRESS,
    defaultAdapterKey: "METH_DEFI",
  },
  {
    key: "fBTC",
    displayName: "Mock fBTC",
    symbol: "mfBTC",
    address: env.MOCK_FBTC_ADDRESS,
    defaultAdapterKey: "FBTC_CEFI",
  },
  {
    key: "MI4",
    displayName: "Mock MI4",
    symbol: "mMI4",
    address: env.MOCK_MI4_ADDRESS,
    defaultAdapterKey: "MI4_DEFI",
  },
] as const;

export const adapterDefinitions: AdapterDefinition[] = [
  {
    key: "USDY_IDLE",
    displayName: "USDY Idle Adapter",
    venueLabel: "Idle",
    address: env.USDY_IDLE_ADAPTER_ADDRESS,
    assetKey: "USDY",
  },
  {
    key: "METH_DEFI",
    displayName: "mETH DeFi Adapter",
    venueLabel: "DeFi Lending",
    address: env.METH_DEFI_ADAPTER_ADDRESS,
    assetKey: "mETH",
  },
  {
    key: "FBTC_CEFI",
    displayName: "fBTC CeFi Adapter",
    venueLabel: "CeFi Earn",
    address: env.FBTC_CEFI_ADAPTER_ADDRESS,
    assetKey: "fBTC",
  },
  {
    key: "MI4_DEFI",
    displayName: "MI4 DeFi Adapter",
    venueLabel: "DeFi Lending",
    address: env.MI4_DEFI_ADAPTER_ADDRESS,
    assetKey: "MI4",
  },
] as const;

export const assetDefinitionByKey = new Map(assetDefinitions.map((asset) => [asset.key, asset]));
export const assetDefinitionByAddress = new Map(
  assetDefinitions.map((asset) => [asset.address.toLowerCase(), asset]),
);
export const adapterDefinitionByKey = new Map(adapterDefinitions.map((adapter) => [adapter.key, adapter]));
export const adapterDefinitionByAddress = new Map(
  adapterDefinitions.map((adapter) => [adapter.address.toLowerCase(), adapter]),
);

export const contractAddresses = {
  vault: env.VAULT_ADDRESS,
  exchange: env.EXCHANGE_ADDRESS,
  agentRegistry: env.AGENT_REGISTRY_ADDRESS,
  strategyRegistry: env.STRATEGY_REGISTRY_ADDRESS,
} as const;

