"use client";

import { useMemo } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { CoverageBadge, KindBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { buildGateReport } from "@/lib/match";
import { filterFindings } from "@/lib/scanner";
import { exportPinsJson, useStore } from "@/lib/store";

export default function CiPage() {
  const { pins, lastScan, settings } = useStore();

  const report = useMemo(() => {
    if (!lastScan) return null;
    return buildGateReport(
      filterFindings(lastScan.findings, settings.patterns),
      pins,
    );
  }, [lastScan, pins, settings.patterns]);

  function download(filename: string, body: string) {
    const blob = new Blob([body], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Gate"
        title="CI check"
        description="Same rule as the local CLI: unregistered or expired findings fail. Covered findings pass. Closed pins do not cover anything."
        actions={
          report ? (
            <Button
              onClick={() =>
                download("shorepin-report.json", JSON.stringify(report, null, 2))
              }
            >
              Download report
            </Button>
          ) : null
        }
      />

      {!lastScan || !report ? (
        <EmptyState
          title="No scan to gate"
          body="Run a scan first. The check script compares a scan JSON file against pins.json and exits non-zero on unregistered or expired findings."
          action={
            <Link href="/scan?sample=1" className={buttonVariants()}>
              Go to Scan
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          <div
            className={
              report.ok
                ? "border border-ok/30 bg-ok/10 px-4 py-4"
                : "border border-destructive/40 bg-destructive/10 px-4 py-4"
            }
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              shorepin check
            </div>
            <div className="mt-1 font-display text-3xl leading-none">
              {report.ok ? "PASS" : "FAIL"}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {report.summary.findings} findings · {report.summary.covered}{" "}
              covered · {report.summary.unregistered} unregistered ·{" "}
              {report.summary.expired} expired
            </p>
          </div>

          {report.failures.length > 0 ? (
            <div className="border border-border bg-card">
              <div className="border-b border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Failures
              </div>
              {report.failures.map((failure) => (
                <div
                  key={`${failure.path}:${failure.line}:${failure.kind}`}
                  className="flex flex-col gap-2 border-b border-border px-3 py-2.5 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate font-mono text-xs">
                      {failure.path}:{failure.line}
                    </div>
                    <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                      {failure.snippet}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <KindBadge kind={failure.kind} />
                    <CoverageBadge coverage={failure.coverage} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No unregistered or expired findings. The gate would pass.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => download("pins.json", exportPinsJson(pins))}
            >
              Download pins.json
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                download(
                  "shorepin-scan.json",
                  JSON.stringify(lastScan, null, 2),
                )
              }
            >
              Download scan JSON
            </Button>
          </div>
        </div>
      )}

      <section className="border border-border bg-card p-4">
        <h2 className="font-display text-2xl">CLI and Action</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Commit a pins.json next to the repo. Scan writes findings. Check
          compares the two and fails the job when something is unregistered or
          past its expiry.
        </p>
        <pre className="mt-4 overflow-x-auto bg-background px-3 py-3 font-mono text-[12px] leading-6 text-foreground">
{`node scripts/scan.mjs --dir . --out shorepin-scan.json
node scripts/check.mjs --pins pins.json --scan shorepin-scan.json`}
        </pre>
        <p className="mt-3 text-sm text-muted-foreground">
          Workflow file:{" "}
          <code className="font-mono text-foreground">
            .github/workflows/shorepin.yml
          </code>
        </p>
      </section>
    </div>
  );
}
