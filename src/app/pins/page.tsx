"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PinDialog, pinToDraft, type PinDraft } from "@/components/pin-dialog";
import { KindBadge, PinStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { daysUntil, formatShortDate } from "@/lib/dates";
import { pinLifecycle } from "@/lib/match";
import { useStore, type PinInput } from "@/lib/store";
import type { PinLifecycle, ShorePin } from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTERS: { id: "all" | PinLifecycle; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "expiring", label: "Expiring" },
  { id: "overdue", label: "Overdue" },
  { id: "closed", label: "Closed" },
];

export default function PinsPage() {
  const { pins, settings, upsertPin, closePin, reopenPin, deletePin } =
    useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PinDraft | null>(null);

  const rows = useMemo(() => {
    return pins
      .map((pin) => ({ pin, status: pinLifecycle(pin) }))
      .filter(({ pin, status }) => {
        if (filter !== "all" && status !== filter) return false;
        if (!query.trim()) return true;
        const hay = `${pin.path} ${pin.kind} ${pin.owner} ${pin.reason}`.toLowerCase();
        return hay.includes(query.trim().toLowerCase());
      });
  }, [pins, filter, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Ledger"
        title="Pins"
        description="Every registered escape. Match key is path + kind + nearby line fingerprint. Close a pin when the escape is gone."
        actions={
          <Button
            onClick={() => {
              setDraft(null);
              setOpen(true);
            }}
          >
            Register pin
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "h-7 rounded-sm border px-2.5 font-mono text-[10px] uppercase tracking-[0.12em]",
                filter === item.id
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter path, owner, reason"
          className="sm:max-w-xs"
        />
      </div>

      {pins.length === 0 ? (
        <EmptyState
          title="No pins registered"
          body="Create one from a scan finding or register it here. Owner, reason, and expiry are mandatory. Temporary without a pull date is just a comment."
          action={
            <Button
              onClick={() => {
                setDraft(null);
                setOpen(true);
              }}
            >
              Register pin
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No pins match this filter.
        </p>
      ) : (
        <div className="border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Path</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ pin, status }) => (
                <PinRow
                  key={pin.id}
                  pin={pin}
                  status={status}
                  onEdit={() => {
                    setDraft(pinToDraft(pin));
                    setOpen(true);
                  }}
                  onClose={() => closePin(pin.id)}
                  onReopen={() => reopenPin(pin.id)}
                  onDelete={() => deletePin(pin.id)}
                />
              ))}
            </TableBody>
          </Table>
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

function PinRow({
  pin,
  status,
  onEdit,
  onClose,
  onReopen,
  onDelete,
}: {
  pin: ShorePin;
  status: PinLifecycle;
  onEdit: () => void;
  onClose: () => void;
  onReopen: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow>
      <TableCell className="max-w-[220px]">
        <div className="truncate font-mono text-xs">{pin.path}</div>
        {pin.line != null ? (
          <div className="font-mono text-[10px] text-muted-foreground">
            line {pin.line}
          </div>
        ) : null}
      </TableCell>
      <TableCell>
        <KindBadge kind={pin.kind} />
      </TableCell>
      <TableCell className="text-sm">{pin.owner}</TableCell>
      <TableCell className="max-w-[240px] whitespace-normal text-sm text-muted-foreground">
        {pin.reason}
      </TableCell>
      <TableCell className="font-mono text-xs">
        <div>{formatShortDate(pin.expiresAt)}</div>
        <div className="text-[10px] text-muted-foreground">
          {daysUntil(pin.expiresAt)}d
        </div>
      </TableCell>
      <TableCell>
        <PinStatusBadge status={status} />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button size="xs" variant="ghost" onClick={onEdit}>
            Edit
          </Button>
          {pin.closedAt ? (
            <Button size="xs" variant="ghost" onClick={onReopen}>
              Reopen
            </Button>
          ) : (
            <Button size="xs" variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
          <Button size="xs" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
