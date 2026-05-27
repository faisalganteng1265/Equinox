import cors from "cors";
import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";

import { env } from "./config/env.js";
import { AppError, toErrorResponse } from "./lib/app-error.js";
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

const app = express();

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

app.use(
  cors({
    origin: env.corsOrigins.length > 0 ? env.corsOrigins : true,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

function requireWriteApiKey(req: Request, _res: Response, next: NextFunction) {
  if (!env.WRITE_API_KEY) {
    return next();
  }

  const providedKey = req.header("x-api-key");
  if (providedKey !== env.WRITE_API_KEY) {
    return next(new AppError(401, "Missing or invalid x-api-key"));
  }

  return next();
}

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
    throw new AppError(400, "agentId must be a positive integer");
  }
  if (!Number.isInteger(decisionLimit) || decisionLimit < 0) {
    throw new AppError(400, "limit must be a non-negative integer");
  }

  res.json(await getAgentSnapshot(agentId, decisionLimit));
});

app.post(`${env.API_PREFIX}/rebalance/preview`, async (req: Request, res: Response) => {
  const payload = previewSchema.parse(req.body);
  res.json(await previewRebalance(payload.targets));
});

app.post(`${env.API_PREFIX}/rebalance/execute`, requireWriteApiKey, async (req: Request, res: Response) => {
  const payload = executeSchema.parse(req.body);
  res.json(await executeRebalance(payload));
});

app.post(`${env.API_PREFIX}/rebalance/reject`, requireWriteApiKey, async (req: Request, res: Response) => {
  const payload = executeSchema.parse(req.body);
  res.json(await recordRejectedDecision(payload));
});

app.post(`${env.API_PREFIX}/market/snapshots`, requireWriteApiKey, async (req: Request, res: Response) => {
  const payload = z.object({ updates: z.array(snapshotUpdateSchema).min(1) }).parse(req.body);
  res.json(await updateMarketSnapshots(payload.updates));
});

app.post(`${env.API_PREFIX}/market/prices`, requireWriteApiKey, async (req: Request, res: Response) => {
  const payload = z.object({ updates: z.array(priceUpdateSchema).min(1) }).parse(req.body);
  res.json(await updateMarketPrices(payload.updates));
});

app.post(`${env.API_PREFIX}/demo/mint`, requireWriteApiKey, async (req: Request, res: Response) => {
  const payload = demoMintSchema.parse(req.body);
  res.json(await mintDemoAsset(payload));
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
  });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const response = toErrorResponse(error);
  res.status(response.statusCode).json(response.body);
});

app.listen(env.PORT, () => {
  console.log(`Equinox API server listening on port ${env.PORT}`);
});

