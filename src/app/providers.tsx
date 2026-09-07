"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <TooltipProvider delay={200}>{children}</TooltipProvider>
    </StoreProvider>
  );
}
