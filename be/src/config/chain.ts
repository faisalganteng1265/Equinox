import { defineChain } from "viem";

import { env } from "./env.js";

export const mantleSepolia = defineChain({
  id: env.MANTLE_CHAIN_ID,
  name: env.MANTLE_CHAIN_NAME,
  network: "mantle-sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Mantle",
    symbol: "MNT",
  },
  rpcUrls: {
    default: {
      http: [env.MANTLE_RPC_URL],
    },
    public: {
      http: [env.MANTLE_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "Mantle Sepolia Explorer",
      url: env.MANTLE_EXPLORER_URL,
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 0,
    },
  },
  testnet: true,
});
