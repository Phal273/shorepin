import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 border border-dashed border-border bg-card/40 px-5 py-8">
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-brass">
        Empty ledger
      </div>
      <h2 className="font-display text-2xl leading-none">{title}</h2>
      <p className="max-w-xl text-sm leading-6 text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}
