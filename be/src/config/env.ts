import "dotenv/config";

import type { Address, Hex } from "viem";
import { z } from "zod";

const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Expected a valid EVM address")
  .transform((value) => value as Address);

const privateKeySchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Expected a 32-byte private key")
  .transform((value) => value as Hex);

const integerFromString = (defaultValue: number) =>
  z
    .string()
    .default(String(defaultValue))
    .transform((value, ctx) => {
      const parsed = Number(value);
      if (!Number.isInteger(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Expected an integer, received "${value}"`,
        });
        return z.NEVER;
      }

      return parsed;
    });

const booleanFromString = (defaultValue: boolean) =>
  z
    .string()
    .default(String(defaultValue))
    .transform((value) => value.toLowerCase() === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: integerFromString(4000),
  API_PREFIX: z.string().default("/api"),
  CORS_ORIGIN: z.string().optional(),
  WRITE_API_KEY: z.string().min(16).optional(),
  ENABLE_DEMO_MINT: booleanFromString(false),
  TX_CONFIRMATIONS: integerFromString(1),
  TX_TIMEOUT_MS: integerFromString(180_000),
  RPC_TIMEOUT_MS: integerFromString(10_000),
  RPC_RETRY_COUNT: integerFromString(3),
  RPC_RETRY_DELAY_MS: integerFromString(150),
  MANTLE_CHAIN_ID: integerFromString(5003),
  MANTLE_CHAIN_NAME: z.string().default("Mantle Sepolia"),
  MANTLE_RPC_URL: z.string().url(),
  MANTLE_EXPLORER_URL: z.string().url().default("https://explorer.sepolia.mantle.xyz"),
  OPERATOR_PRIVATE_KEY: privateKeySchema,
  VAULT_ADDRESS: addressSchema,
  AGENT_ID: integerFromString(1),
  AGENT_REGISTRY_ADDRESS: addressSchema,
  STRATEGY_REGISTRY_ADDRESS: addressSchema,
  EXCHANGE_ADDRESS: addressSchema,
  MOCK_USDY_ADDRESS: addressSchema,
  MOCK_METH_ADDRESS: addressSchema,
  MOCK_FBTC_ADDRESS: addressSchema,
  MOCK_MI4_ADDRESS: addressSchema,
  USDY_IDLE_ADAPTER_ADDRESS: addressSchema,
  METH_DEFI_ADAPTER_ADDRESS: addressSchema,
  FBTC_CEFI_ADAPTER_ADDRESS: addressSchema,
  MI4_DEFI_ADAPTER_ADDRESS: addressSchema,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid backend environment configuration");
  console.error(z.prettifyError(parsed.error));
  process.exit(1);
}

const parsedCorsOrigins = parsed.data.CORS_ORIGIN
  ? parsed.data.CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];

function redactAddress(address: Address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const env = {
  ...parsed.data,
  corsOrigins: parsedCorsOrigins,
} as const;

export const envBootSummary = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  apiPrefix: env.API_PREFIX,
  chainId: env.MANTLE_CHAIN_ID,
  chainName: env.MANTLE_CHAIN_NAME,
  demoMintEnabled: env.ENABLE_DEMO_MINT,
  writeApiKeyProtected: Boolean(env.WRITE_API_KEY),
  rpcTimeoutMs: env.RPC_TIMEOUT_MS,
  rpcRetryCount: env.RPC_RETRY_COUNT,
  vaultAddress: redactAddress(env.VAULT_ADDRESS),
} as const;
