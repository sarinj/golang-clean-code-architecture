"use client";

import { useQuery } from "@tanstack/react-query";

import { getMonitor } from "@/features/dashboard/api/monitor";
import { monitorKey } from "@/features/dashboard/api/queryKeys";

export function useMonitor() {
  return useQuery({
    queryKey: monitorKey,
    queryFn: ({ signal }) => getMonitor(signal),
    refetchInterval: 60_000,
  });
}
