import { randomUUID } from "node:crypto";

import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";

import { env } from "./config/env.js";
import { AppError, toErrorResponse } from "./lib/app-error.js";
import { logEvent } from "./lib/logger.js";
import {
  executeRebalance,
  getAgentSnapshot,
  getContractsSnapshot,
  getHealthSnapshot,
  getMarketSnapshot,
  getPortfolioSnapshot,
  getVaultSnapshot,
  mintDemoAsset,
  previewRebalance,
  recordRejectedDecision,
  updateMarketPrices,
  updateMarketSnapshots,
} from "./services/equinox.js";

const rebalanceTargetSchema = z.object({
  asset: z.string().min(1),
  adapter: z.string().min(1).optional(),
  weightBps: z.number().int().min(0).max(10_000),
});

const executeSchema = z.object({
  targets: z.array(rebalanceTargetSchema).min(1),
  reasoning: z.unknown().optional(),
  reasoningHash: z.string().optional(),
  detailsUri: z.string().optional(),
});

const previewSchema = z.object({
  targets: z.array(rebalanceTargetSchema).min(1),
});

const snapshotUpdateSchema = z.object({
  adapter: z.string().min(1),
  apyBps: z.number().int().min(0).max(100_000),
  riskScore: z.number().int().min(0).max(10_000),
  liquidityScore: z.number().int().min(0).max(10_000),
  sourceTimestamp: z.number().int().positive().optional(),
  sourceHash: z.string().optional(),
  sourceLabel: z.string().optional(),
});

const priceUpdateSchema = z.object({
  asset: z.string().min(1),
  price: z.string().min(1).optional(),
  priceE18: z.string().min(1).optional(),
});

const demoMintSchema = z.object({
  asset: z.string().min(1),
  recipient: z.string().min(1),
  amount: z.string().min(1).optional(),
  amountRaw: z.string().min(1).optional(),
});

function getRequestId(res: Response) {
  return (res.locals.requestId as string | undefined) ?? "unknown";
}

function requireWriteApiKey(req: Request, _res: Response, next: NextFunction) {
  if (!env.WRITE_API_KEY) {
    return next();
  }

  const providedKey = req.header("x-api-key");
  if (providedKey !== env.WRITE_API_KEY) {
    return next(new AppError(401, "Missing or invalid x-api-key", undefined, "write_api_key_invalid"));
  }

  return next();
}

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigins.length > 0 ? env.corsOrigins : true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = randomUUID();
    const startedAt = Date.now();

    res.locals.requestId = requestId;
    res.setHeader("x-request-id", requestId);

    res.on("finish", () => {
      logEvent("info", "http_request", {
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        elapsedMs: Date.now() - startedAt,
      });
    });

    next();
  });

  app.get("/", (_req: Request, res: Response) => {
    res.json({
      message: "Equinox API is running",
      apiPrefix: env.API_PREFIX,
    });
  });

  app.get("/health", async (_req: Request, res: Response) => {
    res.json(await getHealthSnapshot());
  });

  app.get(`${env.API_PREFIX}/contracts`, async (_req: Request, res: Response) => {
    res.json(await getContractsSnapshot());
  });

  app.get(`${env.API_PREFIX}/vault`, async (_req: Request, res: Response) => {
    res.json(await getVaultSnapshot());
  });

  app.get(`${env.API_PREFIX}/portfolio`, async (_req: Request, res: Response) => {
    res.json(await getPortfolioSnapshot());
  });

  app.get(`${env.API_PREFIX}/market`, async (_req: Request, res: Response) => {
    res.json(await getMarketSnapshot());
  });

  app.get(`${env.API_PREFIX}/agents/:agentId`, async (req: Request, res: Response) => {
    const agentId = Number(req.params.agentId);
    const decisionLimit = req.query.limit ? Number(req.query.limit) : 10;
    if (!Number.isInteger(agentId) || agentId <= 0) {
      throw new AppError(400, "agentId must be a positive integer", { agentId: req.params.agentId }, "agent_id_invalid");
    }
    if (!Number.isInteger(decisionLimit) || decisionLimit < 0) {
      throw new AppError(400, "limit must be a non-negative integer", { limit: req.query.limit }, "agent_limit_invalid");
    }

    res.json(await getAgentSnapshot(agentId, decisionLimit));
  });

  app.post(`${env.API_PREFIX}/rebalance/preview`, async (req: Request, res: Response) => {
    const payload = previewSchema.parse(req.body);
    const result = await previewRebalance(payload.targets);

    logEvent("info", "rebalance_preview", {
      requestId: getRequestId(res),
      accepted: result.preview.ok,
      reason: result.preview.reason,
      totalWeightBps: result.preview.totalWeightBps,
    });

    res.json(result);
  });

  app.post(`${env.API_PREFIX}/rebalance/execute`, requireWriteApiKey, async (req: Request, res: Response) => {
    const payload = executeSchema.parse(req.body);
    const result = await executeRebalance(payload);

    logEvent("info", "rebalance_execute", {
      requestId: getRequestId(res),
      transactionHash: result.receipt.transactionHash,
      totalWeightBps: result.preview.totalWeightBps,
    });

    res.json(result);
  });

  app.post(`${env.API_PREFIX}/rebalance/reject`, requireWriteApiKey, async (req: Request, res: Response) => {
    const payload = executeSchema.parse(req.body);
    const result = await recordRejectedDecision(payload);

    logEvent("info", "rebalance_reject", {
      requestId: getRequestId(res),
      transactionHash: result.receipt.transactionHash,
      reason: result.preview.reason,
    });

    res.json(result);
  });

  app.post(`${env.API_PREFIX}/market/snapshots`, requireWriteApiKey, async (req: Request, res: Response) => {
    const payload = z.object({ updates: z.array(snapshotUpdateSchema).min(1) }).parse(req.body);
    const result = await updateMarketSnapshots(payload.updates);

    logEvent("info", "market_snapshots_update", {
      requestId: getRequestId(res),
      updated: result.updated,
      transactionHashes: result.receipts.map((receipt) => receipt.receipt.transactionHash),
    });

    res.json(result);
  });

  app.post(`${env.API_PREFIX}/market/prices`, requireWriteApiKey, async (req: Request, res: Response) => {
    const payload = z.object({ updates: z.array(priceUpdateSchema).min(1) }).parse(req.body);
    const result = await updateMarketPrices(payload.updates);

    logEvent("info", "market_prices_update", {
      requestId: getRequestId(res),
      updated: result.updated,
      transactionHashes: result.receipts.map((receipt) => receipt.receipt.transactionHash),
    });

    res.json(result);
  });

  app.post(`${env.API_PREFIX}/demo/mint`, requireWriteApiKey, async (req: Request, res: Response) => {
    const payload = demoMintSchema.parse(req.body);
    const result = await mintDemoAsset(payload);

    logEvent("info", "demo_mint", {
      requestId: getRequestId(res),
      assetKey: result.assetKey,
      recipient: result.recipient,
      transactionHash: result.receipt.transactionHash,
    });

    res.json(result);
  });

  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(404, "Not Found", undefined, "route_not_found"));
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const response = toErrorResponse(error, getRequestId(res));
    if (response.statusCode >= 500) {
      logEvent("error", "http_error", {
        requestId: getRequestId(res),
        statusCode: response.statusCode,
        reason: response.body.reason,
        error: response.body.error,
      });
    }

    res.status(response.statusCode).json(response.body);
  });

  return app;
}
