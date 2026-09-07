import { daysUntil } from "./dates";
import { normalizePath } from "./fingerprint";
import type {
  FindingCoverage,
  GateReport,
  MatchedFinding,
  ScanFinding,
  ShorePin,
} from "./types";

export function isPinOpen(pin: ShorePin): boolean {
  return pin.closedAt == null;
}

export function isPinOverdue(pin: ShorePin, today?: string): boolean {
  return isPinOpen(pin) && daysUntil(pin.expiresAt, today) < 0;
}

export function isPinExpiring(pin: ShorePin, today?: string): boolean {
  if (!isPinOpen(pin) || isPinOverdue(pin, today)) return false;
  return daysUntil(pin.expiresAt, today) <= 7;
}

export function pinLifecycle(pin: ShorePin, today?: string) {
  if (!isPinOpen(pin)) return "closed" as const;
  if (isPinOverdue(pin, today)) return "overdue" as const;
  if (isPinExpiring(pin, today)) return "expiring" as const;
  return "active" as const;
}

export function matchPin(
  finding: ScanFinding,
  pins: ShorePin[],
): ShorePin | null {
  const open = pins.filter(
    (pin) =>
      isPinOpen(pin) &&
      normalizePath(pin.path) === normalizePath(finding.path) &&
      pin.kind === finding.kind,
  );
  if (open.length === 0) return null;

  const exact = open.find((pin) => pin.fingerprint === finding.fingerprint);
  if (exact) return exact;

  const nearby = open.find(
    (pin) => pin.line != null && Math.abs(pin.line - finding.line) <= 8,
  );
  if (nearby) return nearby;

  if (open.length === 1) return open[0];
  return null;
}

export function coverageFor(
  finding: ScanFinding,
  pins: ShorePin[],
  today?: string,
): MatchedFinding {
  const pin = matchPin(finding, pins);
  let coverage: FindingCoverage = "unregistered";
  if (pin) {
    coverage = isPinOverdue(pin, today) ? "expired" : "covered";
  }
  return { ...finding, coverage, pin };
}

export function matchScan(
  findings: ScanFinding[],
  pins: ShorePin[],
  today?: string,
): MatchedFinding[] {
  return findings.map((finding) => coverageFor(finding, pins, today));
}

export function buildGateReport(
  findings: ScanFinding[],
  pins: ShorePin[],
  today?: string,
): GateReport {
  const matched = matchScan(findings, pins, today);
  const unregistered = matched.filter((item) => item.coverage === "unregistered");
  const expired = matched.filter((item) => item.coverage === "expired");
  const covered = matched.filter((item) => item.coverage === "covered");

  return {
    ok: unregistered.length === 0 && expired.length === 0,
    checkedAt: new Date().toISOString(),
    summary: {
      findings: matched.length,
      covered: covered.length,
      unregistered: unregistered.length,
      expired: expired.length,
      closedPins: pins.filter((pin) => !isPinOpen(pin)).length,
      activePins: pins.filter((pin) => isPinOpen(pin)).length,
    },
    failures: [...unregistered, ...expired].map((item) => ({
      coverage: item.coverage === "expired" ? "expired" : "unregistered",
      path: item.path,
      line: item.line,
      kind: item.kind,
      snippet: item.snippet,
      pinId: item.pin?.id,
      owner: item.pin?.owner,
      expiresAt: item.pin?.expiresAt,
    })),
    findings: matched,
  };
}
