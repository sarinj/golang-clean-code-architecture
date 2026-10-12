"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";

import { ApiError } from "@/lib/api/error";
import { sessionExpiredEvent } from "@/lib/api/sessionEvents";

export function QueryProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (count, error) =>
              count < 2 &&
              (!(error instanceof ApiError) || error.status >= 500),
            refetchOnWindowFocus: true,
          },
          mutations: { retry: false },
        },
      }),
  );

  useEffect(() => {
    function expireSession() {
      queryClient.clear();
      router.replace("/login?expired=1");
      router.refresh();
    }
    window.addEventListener(sessionExpiredEvent, expireSession);
    return () => window.removeEventListener(sessionExpiredEvent, expireSession);
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="bottom-right" richColors closeButton />
    </QueryClientProvider>
  );
}
