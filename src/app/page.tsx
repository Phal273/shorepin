"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PinDialog, pinToDraft, type PinDraft } from "@/components/pin-dialog";
import { CoverageBadge, KindBadge, PinStatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { daysUntil, formatShortDate } from "@/lib/dates";
import { filterFindings } from "@/lib/scanner";
import {
  isPinExpiring,
  isPinOpen,
  isPinOverdue,
  matchScan,
  pinLifecycle,
} from "@/lib/match";
import { useStore, type PinInput } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { pins, lastScan, settings, upsertPin } = useStore();
  const [draft, setDraft] = useState<PinDraft | null>(null);
  const [open, setOpen] = useState(false);

  const stats = useMemo(() => {
    const openPins = pins.filter(isPinOpen);
    const overdue = openPins.filter((pin) => isPinOverdue(pin));
    const expiring = openPins.filter((pin) => isPinExpiring(pin));
    const findings = lastScan
      ? filterFindings(lastScan.findings, settings.patterns)
      : [];
    const matched = matchScan(findings, pins);
    const unregistered = matched.filter((item) => item.coverage === "unregistered");
    return {
      active: openPins.length,
      expiring: expiring.length,
      overdue: overdue.length,
      unregisteredCount: unregistered.length,
      overduePins: overdue,
      expiringPins: expiring,
      unregistered,
      scanned: Boolean(lastScan),
    };
  }, [pins, lastScan, settings.patterns]);

  const empty = pins.length === 0 && !lastScan;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Overview"
        title="Dashboard"
        description="Shore pins are temporary escapes with an owner and a pull date. Unregistered findings and overdue pins are the ones that fail the gate."
        actions={
          <>
            <Link href="/scan" className={buttonVariants({ variant: "outline" })}>
              Run a scan
            </Link>
            <Button
              onClick={() => {
                setDraft(null);
                setOpen(true);
              }}
            >
              Register pin
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Active pins"
          value={stats.active}
          hint="Open ledger entries"
        />
        <Stat
          label="Expiring in 7 days"
          value={stats.expiring}
          hint="Pull these before they set"
          tone={stats.expiring ? "warn" : "default"}
        />
        <Stat
          label="Overdue"
          value={stats.overdue}
          hint="Expiry already passed"
          tone={stats.overdue ? "danger" : "default"}
        />
        <Stat
          label="Unregistered"
          value={stats.scanned ? stats.unregisteredCount : "—"}
          hint={stats.scanned ? "From last scan" : "No scan yet"}
          tone={stats.unregisteredCount ? "rust" : "default"}
        />
      </div>

      {empty ? (
        <EmptyState
          title="Nothing on the ledger yet"
          body="Scan a tree or register a pin. Shorepin stores this browser's pins and last scan in localStorage. There is no demo tenant and no fake company data."
          action={
            <div className="flex gap-2">
              <Link href="/scan?sample=1" className={buttonVariants()}>
                Load sample workspace
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  setDraft(null);
                  setOpen(true);
                }}
              >
                Register manually
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <AttentionList
            title="Pins that need pulling"
            empty="No expiring or overdue pins."
          >
            {[...stats.overduePins, ...stats.expiringPins].map((pin) => (
              <button
                key={pin.id}
                type="button"
                onClick={() => {
                  setDraft(pinToDraft(pin));
                  setOpen(true);
                }}
                className="flex w-full items-start justify-between gap-3 border-b border-border px-3 py-2.5 text-left last:border-0 hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <div className="truncate font-mono text-xs">{pin.path}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <KindBadge kind={pin.kind} />
                    <span className="text-xs text-muted-foreground">
                      {pin.owner}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <PinStatusBadge status={pinLifecycle(pin)} />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {formatShortDate(pin.expiresAt)} · {daysUntil(pin.expiresAt)}d
                  </span>
                </div>
              </button>
            ))}
          </AttentionList>

          <AttentionList
            title="Unregistered findings"
            empty={
              stats.scanned
                ? "Last scan is fully covered."
                : "Run a scan to populate this list."
            }
          >
            {stats.unregistered.slice(0, 12).map((finding) => (
              <button
                key={`${finding.path}:${finding.line}:${finding.kind}`}
                type="button"
                onClick={() => {
                  setDraft({
                    path: finding.path,
                    kind: finding.kind,
                    line: finding.line,
                    fingerprint: finding.fingerprint,
                    reason: "",
                  });
                  setOpen(true);
                }}
                className="flex w-full items-start justify-between gap-3 border-b border-border px-3 py-2.5 text-left last:border-0 hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <div className="truncate font-mono text-xs">
                    {finding.path}:{finding.line}
                  </div>
                  <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                    {finding.snippet}
                  </div>
                </div>
                <CoverageBadge coverage="unregistered" />
              </button>
            ))}
          </AttentionList>
        </div>
      )}

      <PinDialog
        open={open}
        onOpenChange={setOpen}
        draft={draft}
        maxDays={settings.defaultMaxPinDays}
        onSubmit={(input: PinInput, id?: string) => upsertPin(input, id)}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint: string;
  tone?: "default" | "warn" | "danger" | "rust";
}) {
  return (
    <div className="border border-border bg-card px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-2 font-display text-4xl leading-none tabular",
          tone === "warn" && "text-warn",
          tone === "danger" && "text-destructive",
          tone === "rust" && "text-primary",
        )}
      >
        {value}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function AttentionList({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasItems = Array.isArray(children)
    ? children.length > 0
    : Boolean(children);
  return (
    <section className="border border-border bg-card">
      <header className="border-b border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </header>
      {hasItems ? (
        <div>{children}</div>
      ) : (
        <p className="px-3 py-6 text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  );
}
