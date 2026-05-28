import { BaseError } from "viem";
import { ZodError } from "zod";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly reason?: string;

  constructor(statusCode: number, message: string, details?: unknown, reason?: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.reason = reason;
  }
}

function errorBody(
  statusCode: number,
  error: string,
  requestId: string,
  reason: string,
  details?: unknown,
) {
  return {
    error,
    details,
    reason,
    requestId,
    statusCode,
  };
}

export function toErrorResponse(error: unknown, requestId = "unknown") {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: errorBody(
        error.statusCode,
        error.message,
        requestId,
        error.reason ?? "app_error",
        error.details,
      ),
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      body: errorBody(
        400,
        "Invalid request payload",
        requestId,
        "invalid_request_payload",
        error.flatten(),
      ),
    };
  }

  if (error instanceof BaseError) {
    return {
      statusCode: 502,
      body: errorBody(
        502,
        error.shortMessage,
        requestId,
        "rpc_request_failed",
        error.details,
      ),
    };
  }

  return {
    statusCode: 500,
    body: errorBody(
      500,
      error instanceof Error ? error.message : "Internal Server Error",
      requestId,
      "internal_server_error",
    ),
  };
}
