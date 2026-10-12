import type { ReactNode } from "react";
import {
  dehydrate,
  defaultShouldDehydrateQuery,
  HydrationBoundary,
} from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { profileKey } from "@/features/auth/api/queryKeys";
import { getServerProfile } from "@/features/auth/server/profile";
import { getServerQueryClient } from "@/lib/server/queryClient";
import { hasSessionCookie } from "@/lib/server/session";
import { ApiError } from "@/lib/api/error";

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!(await hasSessionCookie())) redirect("/login");
  const client = getServerQueryClient();
  await client.prefetchQuery({
    queryKey: profileKey,
    queryFn: getServerProfile,
  });
  const failure = client.getQueryState(profileKey)?.error;
  if (failure instanceof ApiError && failure.status === 401) {
    // The page redirects with its own destination before the shell mounts.
    return children;
  }
  const state = dehydrate(client, {
    shouldDehydrateQuery: (query) =>
      query.queryKey[0] === "auth" && defaultShouldDehydrateQuery(query),
  });
  return (
    <HydrationBoundary state={state}>
      <AppShell>{children}</AppShell>
    </HydrationBoundary>
  );
}
