import { env } from "../config/env.js";
import { AppError } from "./app-error.js";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: unknown) {
  if (error instanceof AppError) {
    return error.statusCode >= 500;
  }

  return true;
}

export async function withRpcRead<T>(label: string, action: () => Promise<T>) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= env.RPC_RETRY_COUNT; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (attempt >= env.RPC_RETRY_COUNT || !isRetryable(error)) {
        break;
      }

      await delay(env.RPC_RETRY_DELAY_MS * attempt);
    }
  }

  throw new AppError(503, `Mantle RPC read failed for ${label}`, {
    label,
    retryCount: env.RPC_RETRY_COUNT,
    cause: lastError instanceof Error ? lastError.message : String(lastError),
  }, "rpc_read_failed");
}
