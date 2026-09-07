export const PIN_KINDS = [
  "eslint-disable",
  "eslint-disable-next-line",
  "eslint-disable-line",
  "ts-ignore",
  "ts-expect-error",
  "ts-nocheck",
  "as-any",
  "as-unknown-as",
  "it-skip",
  "describe-skip",
  "test-skip",
  "xit",
  "xdescribe",
  "noqa",
  "nosec",
  "nosemgrep",
  "hack",
  "fixme",
] as const;

export type PinKind = (typeof PIN_KINDS)[number];

export type PinRecordStatus = "active" | "closed";
export type PinLifecycle = "active" | "expiring" | "overdue" | "closed";
export type FindingCoverage = "unregistered" | "covered" | "expired";

export type ShorePin = {
  id: string;
  path: string;
  kind: PinKind;
  line: number | null;
  fingerprint: string;
  owner: string;
  reason: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
};

export type ScanFinding = {
  path: string;
  line: number;
  kind: PinKind;
  snippet: string;
  fingerprint: string;
};

export type ScanResult = {
  scannedAt: string;
  source: "paste" | "upload" | "sample" | "cli";
  fileCount: number;
  findings: ScanFinding[];
};

export type PatternToggles = Record<PinKind, boolean>;

export type Settings = {
  orgName: string;
  defaultMaxPinDays: number;
  patterns: PatternToggles;
};

export type MatchedFinding = ScanFinding & {
  coverage: FindingCoverage;
  pin: ShorePin | null;
};

export type GateReport = {
  ok: boolean;
  checkedAt: string;
  summary: {
    findings: number;
    covered: number;
    unregistered: number;
    expired: number;
    closedPins: number;
    activePins: number;
  };
  failures: Array<{
    coverage: "unregistered" | "expired";
    path: string;
    line: number;
    kind: PinKind;
    snippet: string;
    pinId?: string;
    owner?: string;
    expiresAt?: string;
  }>;
  findings: MatchedFinding[];
};
