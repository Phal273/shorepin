import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FindingCoverage, PinLifecycle } from "@/lib/types";

const PIN_STYLES: Record<PinLifecycle, string> = {
  active: "border-ok/30 bg-ok/10 text-ok",
  expiring: "border-warn/30 bg-warn/10 text-warn",
  overdue: "border-destructive/40 bg-destructive/15 text-destructive",
  closed: "border-border bg-muted text-muted-foreground",
};

const FINDING_STYLES: Record<FindingCoverage, string> = {
  covered: "border-ok/30 bg-ok/10 text-ok",
  expired: "border-destructive/40 bg-destructive/15 text-destructive",
  unregistered: "border-primary/40 bg-primary/12 text-primary",
};

export function PinStatusBadge({ status }: { status: PinLifecycle }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-sm px-1.5 font-mono text-[10px] uppercase tracking-[0.12em]",
        PIN_STYLES[status],
      )}
    >
      {status}
    </Badge>
  );
}

export function CoverageBadge({ coverage }: { coverage: FindingCoverage }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-sm px-1.5 font-mono text-[10px] uppercase tracking-[0.12em]",
        FINDING_STYLES[coverage],
      )}
    >
      {coverage}
    </Badge>
  );
}

export function KindBadge({ kind }: { kind: string }) {
  return (
    <Badge
      variant="outline"
      className="rounded-sm border-border bg-secondary px-1.5 font-mono text-[10px] text-foreground"
    >
      {kind}
    </Badge>
  );
}
