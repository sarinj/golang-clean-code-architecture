"use client";

import { useMonitor } from "@/features/dashboard/hooks/use-monitor";
import { cn } from "@/lib/utils";

export function ApiStatus() {
  const monitor = useMonitor();
  const available = monitor.isSuccess && !monitor.isError;
  return (
    <span
      role="status"
      className="inline-flex items-center gap-2 text-xs text-muted-foreground"
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          monitor.isPending
            ? "bg-muted-foreground"
            : available
              ? "bg-emerald-500"
              : "bg-amber-500",
        )}
      />
      {monitor.isPending
        ? "Connecting"
        : available
          ? "API connected"
          : "API unavailable"}
    </span>
  );
}
