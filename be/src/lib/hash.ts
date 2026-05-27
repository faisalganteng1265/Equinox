import { keccak256, stringToHex, type Hex, isHex } from "viem";

import { AppError } from "./app-error.js";

function stableStringifyInternal(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "bigint") {
    return JSON.stringify(value.toString());
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringifyInternal(entry)).join(",")}]`;
  }
  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    const keys = Object.keys(objectValue).sort();
    const entries = keys.map((key) => `${JSON.stringify(key)}:${stableStringifyInternal(objectValue[key])}`);
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(String(value));
}

export function stableStringify(value: unknown): string {
  return stableStringifyInternal(value);
}

export function normalizeExplicitHash(value: string): Hex {
  if (!isHex(value, { strict: true }) || value.length !== 66) {
    throw new AppError(400, "Expected a 32-byte hex hash");
  }

  return value;
}

export function deriveHashFromPayload(value: unknown): Hex {
  const payload = typeof value === "string" ? value : stableStringify(value);
  return keccak256(stringToHex(payload));
}

