import { createApp } from "./app.js";
import { env, envBootSummary } from "./config/env.js";
import { logEvent } from "./lib/logger.js";
import { startOrchestrator } from "./services/orchestrator.js";

const app = createApp();

app.listen(env.PORT, () => {
  logEvent("info", "server_started", envBootSummary);

  if (env.ORCHESTRATOR_ENABLED) {
    startOrchestrator();
  }
});
