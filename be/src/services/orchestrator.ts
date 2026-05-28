import type { Address } from "viem";

import { contractAddresses } from "../config/equinox.js";
import { env } from "../config/env.js";
import { logEvent } from "../lib/logger.js";
import { vaultFactoryAbi } from "../contracts/abis.js";
import { publicClient } from "./clients.js";
import {
  getPortfolioSnapshot,
  previewRebalance,
  executeRebalance,
  recordRejectedDecision,
} from "./equinox.js";
import { computeStrategy } from "./strategy.js";
import { generateReasoning } from "./reasoning.js";
import { refreshMarketData } from "./market-sim.js";

let orchestratorTimer: ReturnType<typeof setInterval> | null = null;
let cycleRunning = false;

async function getAllVaults(): Promise<Address[]> {
  const factory = contractAddresses.vaultFactory;
  if (!factory) {
    return [contractAddresses.vault as Address];
  }

  return (await publicClient.readContract({
    address: factory,
    abi: vaultFactoryAbi,
    functionName: "allVaults",
  })) as Address[];
}

async function runVaultCycle(vaultAddress: Address): Promise<void> {
  logEvent("info", "orchestrator_vault_start", { vault: vaultAddress });

  let portfolio: Awaited<ReturnType<typeof getPortfolioSnapshot>>;
  try {
    portfolio = await getPortfolioSnapshot({ vault: vaultAddress });
  } catch (error) {
    logEvent("warn", "orchestrator_portfolio_error", { vault: vaultAddress, error: String(error) });
    return;
  }

  const totalValue = parseFloat(portfolio.vault.totalPortfolioValueFormatted);
  if (totalValue === 0) {
    logEvent("info", "orchestrator_vault_empty", { vault: vaultAddress });
    return;
  }

  const decision = computeStrategy(
    vaultAddress,
    portfolio.vault.currentRiskProfileCode,
    portfolio.vault.totalPortfolioValueFormatted,
    portfolio.assets,
    env.DRIFT_THRESHOLD_BPS,
  );

  if (!decision.shouldExecute) {
    logEvent("info", "orchestrator_within_threshold", {
      vault: vaultAddress,
      driftBps: decision.driftBps,
      thresholdBps: env.DRIFT_THRESHOLD_BPS,
    });
    return;
  }

  const reasoning = await generateReasoning(decision.reasoningInput);
  logEvent("info", "orchestrator_reasoning_ready", {
    vault: vaultAddress,
    confidence: reasoning.confidence,
    model: reasoning.payload.model,
  });

  let preview: Awaited<ReturnType<typeof previewRebalance>>;
  try {
    preview = await previewRebalance(decision.targets, { vault: vaultAddress });
  } catch (error) {
    logEvent("warn", "orchestrator_preview_error", { vault: vaultAddress, error: String(error) });
    return;
  }

  if (preview.preview.ok) {
    try {
      const result = await executeRebalance({
        targets: decision.targets,
        reasoning: reasoning.payload,
        detailsUri: reasoning.text,
        vault: vaultAddress,
      });
      logEvent("info", "orchestrator_executed", {
        vault: vaultAddress,
        tx: result.receipt.transactionHash,
        totalWeightBps: result.preview.totalWeightBps,
      });
    } catch (error) {
      logEvent("warn", "orchestrator_execute_error", { vault: vaultAddress, error: String(error) });
    }
  } else {
    try {
      const result = await recordRejectedDecision({
        targets: decision.targets,
        reasoning: reasoning.payload,
        detailsUri: reasoning.text,
        vault: vaultAddress,
      });
      logEvent("info", "orchestrator_rejected", {
        vault: vaultAddress,
        tx: result.receipt.transactionHash,
        reason: result.preview.reason,
      });
    } catch (error) {
      logEvent("warn", "orchestrator_reject_error", { vault: vaultAddress, error: String(error) });
    }
  }
}

async function runCycle(): Promise<void> {
  if (cycleRunning) {
    logEvent("warn", "orchestrator_cycle_skipped", { reason: "previous cycle still running" });
    return;
  }

  cycleRunning = true;
  logEvent("info", "orchestrator_cycle_start", {});

  try {
    let vaults: Address[];
    try {
      vaults = await getAllVaults();
    } catch (error) {
      logEvent("warn", "orchestrator_vault_list_error", { error: String(error) });
      return;
    }

    logEvent("info", "orchestrator_vaults_found", { count: vaults.length });

    await refreshMarketData();

    for (const vault of vaults) {
      await runVaultCycle(vault);
    }

    logEvent("info", "orchestrator_cycle_done", { count: vaults.length });
  } finally {
    cycleRunning = false;
  }
}

export function startOrchestrator(): void {
  if (orchestratorTimer !== null) return;

  logEvent("info", "orchestrator_started", {
    intervalMs: env.ORCHESTRATOR_INTERVAL_MS,
    driftThresholdBps: env.DRIFT_THRESHOLD_BPS,
    model: env.OPENROUTER_MODEL,
  });

  void runCycle();
  orchestratorTimer = setInterval(() => void runCycle(), env.ORCHESTRATOR_INTERVAL_MS);
}

export function stopOrchestrator(): void {
  if (orchestratorTimer !== null) {
    clearInterval(orchestratorTimer);
    orchestratorTimer = null;
    logEvent("info", "orchestrator_stopped", {});
  }
}
