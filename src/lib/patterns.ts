import type { PinKind, PatternToggles } from "./types";

export type PatternGroup =
  | "eslint"
  | "typescript"
  | "cast"
  | "test-skip"
  | "linter"
  | "marker";

export type PatternDef = {
  kind: PinKind;
  label: string;
  group: PatternGroup;
  groupLabel: string;
  description: string;
  test: RegExp;
  toggleable: boolean;
  defaultOn: boolean;
};

export const PATTERNS: PatternDef[] = [
  {
    kind: "eslint-disable-next-line",
    label: "eslint-disable-next-line",
    group: "eslint",
    groupLabel: "ESLint",
    description: "Next-line ESLint suppressions",
    test: /eslint-disable-next-line/,
    toggleable: true,
    defaultOn: true,
  },
  {
    kind: "eslint-disable-line",
    label: "eslint-disable-line",
    group: "eslint",
    groupLabel: "ESLint",
    description: "Same-line ESLint suppressions",
    test: /eslint-disable-line/,
    toggleable: true,
    defaultOn: true,
  },
  {
    kind: "eslint-disable",
    label: "eslint-disable",
    group: "eslint",
    groupLabel: "ESLint",
    description: "Block ESLint disable comments",
    test: /eslint-disable(?!-)/,
    toggleable: true,
    defaultOn: true,
  },
  {
    kind: "ts-expect-error",
    label: "@ts-expect-error",
    group: "typescript",
    groupLabel: "TypeScript",
    description: "Typed error suppressions",
    test: /@ts-expect-error/,
    toggleable: true,
    defaultOn: true,
  },
  {
    kind: "ts-ignore",
    label: "@ts-ignore",
    group: "typescript",
    groupLabel: "TypeScript",
    description: "Untyped TypeScript ignore comments",
    test: /@ts-ignore/,
    toggleable: true,
    defaultOn: true,
  },
  {
    kind: "ts-nocheck",
    label: "@ts-nocheck",
    group: "typescript",
    groupLabel: "TypeScript",
    description: "File-level TypeScript nocheck",
    test: /@ts-nocheck/,
    toggleable: true,
    defaultOn: true,
  },
  {
    kind: "as-unknown-as",
    label: "as unknown as",
    group: "cast",
    groupLabel: "Casts",
    description: "Double assertion through unknown",
    test: /\bas\s+unknown\s+as\b/,
    toggleable: true,
    defaultOn: true,
  },
  {
    kind: "as-any",
    label: "as any",
    group: "cast",
    groupLabel: "Casts",
    description: "Explicit any casts",
    test: /\bas\s+any\b/,
    toggleable: true,
    defaultOn: true,
  },
  {
    kind: "it-skip",
    label: "it.skip",
    group: "test-skip",
    groupLabel: "Test skips",
    description: "Skipped it() cases",
    test: /\bit\.skip\b/,
    toggleable: true,
    defaultOn: true,
  },
  {
    kind: "describe-skip",
    label: "describe.skip",
    group: "test-skip",
    groupLabel: "Test skips",
    description: "Skipped describe() blocks",
    test: /\bdescribe\.skip\b/,
    toggleable: true,
    defaultOn: true,
  },
  {
    kind: "test-skip",
    label: "test.skip",
    group: "test-skip",
    groupLabel: "Test skips",
    description: "Skipped test() cases",
    test: /\btest\.skip\b/,
    toggleable: true,
    defaultOn: true,
  },
  {
    kind: "xit",
    label: "xit",
    group: "test-skip",
    groupLabel: "Test skips",
    description: "xit() skipped cases",
    test: /\bxit\s*\(/,
    toggleable: true,
    defaultOn: true,
  },
  {
    kind: "xdescribe",
    label: "xdescribe",
    group: "test-skip",
    groupLabel: "Test skips",
    description: "xdescribe() skipped suites",
    test: /\bxdescribe\s*\(/,
    toggleable: true,
    defaultOn: true,
  },
  {
    kind: "noqa",
    label: "# noqa",
    group: "linter",
    groupLabel: "Linter waivers",
    description: "Python flake8 / ruff noqa",
    test: /#\s*noqa\b/i,
    toggleable: true,
    defaultOn: true,
  },
  {
    kind: "nosec",
    label: "# nosec",
    group: "linter",
    groupLabel: "Linter waivers",
    description: "Bandit nosec waivers",
    test: /#\s*nosec\b/i,
    toggleable: true,
    defaultOn: true,
  },
  {
    kind: "nosemgrep",
    label: "// nosemgrep",
    group: "linter",
    groupLabel: "Linter waivers",
    description: "Semgrep suppressions",
    test: /\/\/\s*nosemgrep\b/i,
    toggleable: true,
    defaultOn: true,
  },
  {
    kind: "hack",
    label: "HACK:",
    group: "marker",
    groupLabel: "Markers",
    description: "HACK: comments. Optional.",
    test: /\bHACK:/,
    toggleable: true,
    defaultOn: true,
  },
  {
    kind: "fixme",
    label: "FIXME:",
    group: "marker",
    groupLabel: "Markers",
    description: "FIXME: comments. Optional.",
    test: /\bFIXME:/,
    toggleable: true,
    defaultOn: true,
  },
];

export const PATTERN_BY_KIND: Record<PinKind, PatternDef> = Object.fromEntries(
  PATTERNS.map((pattern) => [pattern.kind, pattern]),
) as Record<PinKind, PatternDef>;

export function defaultPatternToggles(): PatternToggles {
  return Object.fromEntries(
    PATTERNS.map((pattern) => [pattern.kind, pattern.defaultOn]),
  ) as PatternToggles;
}

export function patternGroups() {
  const groups: {
    id: PatternGroup;
    label: string;
    patterns: PatternDef[];
  }[] = [];
  for (const pattern of PATTERNS) {
    let group = groups.find((item) => item.id === pattern.group);
    if (!group) {
      group = { id: pattern.group, label: pattern.groupLabel, patterns: [] };
      groups.push(group);
    }
    group.patterns.push(pattern);
  }
  return groups;
}
