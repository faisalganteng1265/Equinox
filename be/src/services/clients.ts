import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, http, type Hex } from "viem";

import { mantleSepolia } from "../config/chain.js";
import { env } from "../config/env.js";

export const operatorAccount = privateKeyToAccount(env.OPERATOR_PRIVATE_KEY as Hex);

const transport = http(env.MANTLE_RPC_URL, {
  timeout: env.RPC_TIMEOUT_MS,
  retryCount: env.RPC_RETRY_COUNT,
  retryDelay: env.RPC_RETRY_DELAY_MS,
});

export const publicClient = createPublicClient({
  chain: mantleSepolia,
  transport,
  batch: {
    multicall: true,
  },
  pollingInterval: 1_000,
});

export const walletClient = createWalletClient({
  account: operatorAccount,
  chain: mantleSepolia,
  transport,
});
