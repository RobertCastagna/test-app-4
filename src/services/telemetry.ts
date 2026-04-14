import { setKv, getKv } from "./database";

type Severity = "info" | "warn" | "error";

interface TelemetryEvent {
  ts: string;
  severity: Severity;
  code: string;
  detail?: Record<string, unknown>;
}

const KEY = "telemetry_events_v1";
const MAX_EVENTS = 500;

async function readAll(): Promise<TelemetryEvent[]> {
  const raw = await getKv(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function logEvent(
  severity: Severity,
  code: string,
  detail?: Record<string, unknown>
): Promise<void> {
  const events = await readAll();
  events.push({ ts: new Date().toISOString(), severity, code, detail });
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
  await setKv(KEY, JSON.stringify(events));
}

export async function exportEvents(): Promise<TelemetryEvent[]> {
  return readAll();
}

export async function clearEvents(): Promise<void> {
  await setKv(KEY, "[]");
}
