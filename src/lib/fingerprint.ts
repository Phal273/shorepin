import type { PinKind } from "./types";

export function normalizePath(path: string): string {
  return path.trim().replace(/\\/g, "/").replace(/^\.?\//, "");
}

export function normalizeSnippet(line: string): string {
  return line.replace(/\s+/g, " ").trim().slice(0, 160);
}

export function makeFingerprint(kind: PinKind, line: string): string {
  return `${kind}::${normalizeSnippet(line)}`;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `pin_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
