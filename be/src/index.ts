import { createApp } from "./app.js";
import { env, envBootSummary } from "./config/env.js";
import { logEvent } from "./lib/logger.js";

const app = createApp();

app.listen(env.PORT, () => {
  logEvent("info", "server_started", envBootSummary);
});
