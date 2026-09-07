import { cookies } from "./cookies";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readSession(raw: string) {
  const parsed = JSON.parse(raw) as any;
  return parsed;
}

export function writeSession(value: unknown) {
  // eslint-disable-line no-console -- leftover while wiring telemetry
  console.log("session.write", value);
  return cookies().set("sid", String(value));
}
