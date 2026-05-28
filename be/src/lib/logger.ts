type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  [key: string]: unknown;
}

export function logEvent(level: LogLevel, event: string, payload: LogPayload = {}) {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...payload,
  };

  const line = JSON.stringify(record);
  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}
