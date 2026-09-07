"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addDaysISO, todayISO } from "@/lib/dates";
import { makeFingerprint } from "@/lib/fingerprint";
import { PATTERNS } from "@/lib/patterns";
import { defaultExpiry, type PinInput } from "@/lib/store";
import type { PinKind, ShorePin } from "@/lib/types";

export type PinDraft = Partial<PinInput> & { id?: string };

export function PinDialog({
  open,
  onOpenChange,
  draft,
  maxDays,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft?: PinDraft | null;
  maxDays: number;
  onSubmit: (input: PinInput, id?: string) => void;
}) {
  const formKey = `${draft?.id ?? "new"}:${draft?.path ?? ""}:${draft?.kind ?? ""}:${draft?.line ?? ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        {open ? (
          <PinForm
            key={formKey}
            draft={draft}
            maxDays={maxDays}
            onSubmit={onSubmit}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PinForm({
  draft,
  maxDays,
  onSubmit,
  onClose,
}: {
  draft?: PinDraft | null;
  maxDays: number;
  onSubmit: (input: PinInput, id?: string) => void;
  onClose: () => void;
}) {
  const maxDate = useMemo(() => addDaysISO(todayISO(), maxDays), [maxDays]);
  const [path, setPath] = useState(draft?.path ?? "");
  const [kind, setKind] = useState<PinKind>(draft?.kind ?? "ts-ignore");
  const [owner, setOwner] = useState(draft?.owner ?? "");
  const [reason, setReason] = useState(draft?.reason ?? "");
  const [expiresAt, setExpiresAt] = useState(
    draft?.expiresAt ?? defaultExpiry(maxDays),
  );
  const [line, setLine] = useState(draft?.line != null ? String(draft.line) : "");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!path.trim()) {
      setError("Path is required.");
      return;
    }
    if (!owner.trim()) {
      setError("Owner is required.");
      return;
    }
    if (!reason.trim()) {
      setError("Reason is required.");
      return;
    }
    if (!expiresAt) {
      setError("Expiry date is required.");
      return;
    }
    if (expiresAt > maxDate) {
      setError(`Expiry cannot be more than ${maxDays} days out.`);
      return;
    }
    const parsedLine = line.trim() ? Number(line) : null;
    const fingerprint =
      draft?.fingerprint ||
      makeFingerprint(kind, `${path}:${parsedLine ?? "?"}`);
    onSubmit(
      {
        path: path.trim(),
        kind,
        line: Number.isFinite(parsedLine) ? parsedLine : null,
        fingerprint,
        owner,
        reason,
        expiresAt,
      },
      draft?.id,
    );
    onClose();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-2xl">
          {draft?.id ? "Edit shore pin" : "Register shore pin"}
        </DialogTitle>
        <DialogDescription>
          Temporary escapes need an owner, a reason, and a date they come out.
          Past dates are allowed so you can mark debt already overdue.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3">
        <Field label="Path">
          <Input
            value={path}
            onChange={(event) => setPath(event.target.value)}
            placeholder="src/session.ts"
            className="font-mono"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Kind">
            <Select
              value={kind}
              onValueChange={(value) => {
                if (typeof value === "string") setKind(value as PinKind);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} align="start">
                {PATTERNS.map((pattern) => (
                  <SelectItem key={pattern.kind} value={pattern.kind}>
                    {pattern.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Line">
            <Input
              value={line}
              onChange={(event) => setLine(event.target.value)}
              placeholder="optional"
              inputMode="numeric"
              className="font-mono"
            />
          </Field>
        </div>
        <Field label="Owner">
          <Input
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="name or handle"
          />
        </Field>
        <Field label="Reason">
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why this escape exists, and what removes it."
            className="min-h-20"
          />
        </Field>
        <Field label={`Expires (max ${maxDays} days from today)`}>
          <Input
            type="date"
            value={expiresAt}
            max={maxDate}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
        </Field>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit}>
          {draft?.id ? "Save pin" : "Register pin"}
        </Button>
      </DialogFooter>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function pinToDraft(pin: ShorePin): PinDraft {
  return {
    id: pin.id,
    path: pin.path,
    kind: pin.kind,
    line: pin.line,
    fingerprint: pin.fingerprint,
    owner: pin.owner,
    reason: pin.reason,
    expiresAt: pin.expiresAt,
  };
}
