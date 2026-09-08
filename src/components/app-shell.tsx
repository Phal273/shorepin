"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Menu,
  ScanSearch,
  Settings,
  ShieldCheck,
  X,
  Pin,
} from "lucide-react";
import { ShorepinMark } from "@/components/mark";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pins", label: "Pins", icon: Pin },
  { href: "/scan", label: "Scan", icon: ScanSearch },
  { href: "/ci", label: "CI check", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { settings, lastScan } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link href="/" className="mb-6 flex items-center gap-2.5 px-2">
          <ShorepinMark className="size-8 rounded-sm" />
          <span className="min-w-0">
            <span className="font-display block text-[22px] leading-none">
              Shorepin
            </span>
            <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Pull before pour
            </span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-sidebar-border px-2 pt-3 font-mono text-[10px] leading-4 text-muted-foreground">
          <div className="truncate text-[11px] text-foreground">
            {settings.orgName}
          </div>
          <div className="mt-1">
            Last scan{" "}
            {lastScan ? formatDateTime(lastScan.scannedAt) : "none"}
          </div>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-2.5 lg:hidden">
          <div className="flex items-center gap-2">
            <ShorepinMark className="size-4 text-primary" />
            <span className="font-display text-lg leading-none">Shorepin</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {open ? <X /> : <Menu />}
          </Button>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
