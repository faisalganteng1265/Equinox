import { BaseError } from "viem";
import { ZodError } from "zod";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: {
        error: error.message,
        details: error.details,
      },
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      body: {
        error: "Invalid request payload",
        details: error.flatten(),
      },
    };
  }

  if (error instanceof BaseError) {
    return {
      statusCode: 502,
      body: {
        error: error.shortMessage,
        details: error.details,
      },
    };
  }

  return {
    statusCode: 500,
    body: {
      error: error instanceof Error ? error.message : "Internal Server Error",
    },
  };
}

