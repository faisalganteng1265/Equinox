import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  executeRebalance: vi.fn(),
  getAgentSnapshot: vi.fn(),
  getContractsSnapshot: vi.fn(),
  getHealthSnapshot: vi.fn(),
  getMarketSnapshot: vi.fn(),
  getPortfolioSnapshot: vi.fn(),
  getVaultSnapshot: vi.fn(),
  mintDemoAsset: vi.fn(),
  previewRebalance: vi.fn(),
  recordRejectedDecision: vi.fn(),
  updateMarketPrices: vi.fn(),
  updateMarketSnapshots: vi.fn(),
}));

vi.mock("../src/services/equinox.js", () => serviceMocks);

import { createApp } from "../src/app.js";

describe("Equinox API smoke tests", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.getHealthSnapshot.mockResolvedValue({
      status: "ok",
      chainId: 5003,
      blockNumber: "123",
      operatorAddress: "0xabc",
      vaultAddress: "0xdef",
      timestamp: "2026-05-28T00:00:00.000Z",
    });
    serviceMocks.getContractsSnapshot.mockResolvedValue({
      chain: {
        id: 5003,
        name: "Mantle Sepolia",
        rpcUrl: "https://rpc.sepolia.mantle.xyz",
        explorerUrl: "https://explorer.sepolia.mantle.xyz",
      },
      operator: {
        address: "0xabc",
        writeApiKeyProtected: true,
        demoMintEnabled: true,
      },
      core: {
        vault: "0xdef",
        exchange: "0x444",
        agentRegistry: "0x222",
        strategyRegistry: "0x333",
        agentId: 1,
      },
      assets: [],
      adapters: [],
    });
    serviceMocks.getPortfolioSnapshot.mockResolvedValue({
      vault: {
        address: "0xdef",
        owner: "0xowner",
        authorizedAgent: "0xagent",
        paused: false,
        currentRiskProfileCode: 1,
        currentRiskProfile: "Balanced",
        agentId: 1,
        totalPortfolioValueE18: "1000000000000000000",
        totalPortfolioValueFormatted: "1",
        trackedAssets: [],
      },
      assets: [],
      updatedAt: "2026-05-28T00:00:00.000Z",
    });
    serviceMocks.getAgentSnapshot.mockResolvedValue({
      agentId: 1,
      stats: {
        totalDecisions: 1,
        successfulDecisions: 1,
        blockedDecisions: 0,
        lastDecisionAt: 1,
        cumulativePerformanceBps: "0",
        reputationScore: 99,
      },
      decisionCount: 1,
      decisions: [],
    });
    serviceMocks.previewRebalance.mockResolvedValue({
      targets: [],
      preview: {
        ok: true,
        reasonCode: 0,
        reason: "None",
        offendingAsset: "0x0000000000000000000000000000000000000000",
        offendingAssetKey: null,
        offendingAdapter: "0x0000000000000000000000000000000000000000",
        offendingAdapterKey: null,
        attemptedWeightBps: 0,
        limitWeightBps: 0,
        totalWeightBps: 10_000,
      },
    });
  });

  it("responds to /health", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.headers["x-request-id"]).toBeTruthy();
  });

  it("responds to /api/contracts", async () => {
    const response = await request(app).get("/api/contracts");

    expect(response.status).toBe(200);
    expect(response.body.core.agentId).toBe(1);
    expect(serviceMocks.getContractsSnapshot).toHaveBeenCalledTimes(1);
  });

  it("responds to /api/portfolio", async () => {
    const response = await request(app).get("/api/portfolio");

    expect(response.status).toBe(200);
    expect(response.body.vault.currentRiskProfile).toBe("Balanced");
    expect(serviceMocks.getPortfolioSnapshot).toHaveBeenCalledTimes(1);
  });

  it("responds to /api/agents/:id", async () => {
    const response = await request(app).get("/api/agents/1");

    expect(response.status).toBe(200);
    expect(response.body.agentId).toBe(1);
    expect(serviceMocks.getAgentSnapshot).toHaveBeenCalledWith(1, 10);
  });

  it("responds to /api/rebalance/preview", async () => {
    const payload = {
      targets: [{ asset: "USDY", adapter: "USDY_IDLE", weightBps: 10_000 }],
    };

    const response = await request(app)
      .post("/api/rebalance/preview")
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.preview.ok).toBe(true);
    expect(serviceMocks.previewRebalance).toHaveBeenCalledWith(payload.targets);
  });
});
