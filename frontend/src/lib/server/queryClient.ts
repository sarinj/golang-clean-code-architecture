import "server-only";

import { cache } from "react";
import {
  dehydrate,
  defaultShouldDehydrateQuery,
  QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { redirect } from "next/navigation";

import { profileKey } from "@/features/auth/api/queryKeys";
import { getServerProfile } from "@/features/auth/server/profile";
import { ApiError } from "@/lib/api/error";
import { hasSessionCookie } from "@/lib/server/session";

export const getServerQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: { queries: { staleTime: 30_000, retry: false } },
    }),
);

type ServerQuery = { queryKey: QueryKey; queryFn: () => Promise<unknown> };

export async function prefetchPage(
  returnTo: string,
  queries: ServerQuery[] = [],
) {
  const client = getServerQueryClient();
  const results = await Promise.allSettled([
    client.fetchQuery({ queryKey: profileKey, queryFn: getServerProfile }),
    ...queries.map((query) => client.fetchQuery(query)),
  ]);
  const authenticationFailed = results.some(
    (result) =>
      result.status === "rejected" &&
      result.reason instanceof ApiError &&
      result.reason.status === 401,
  );
  if (authenticationFailed) {
    if (await hasSessionCookie())
      redirect(`/session/refresh?returnTo=${encodeURIComponent(returnTo)}`);
    redirect("/login?expired=1");
  }
  return dehydrate(client, {
    shouldDehydrateQuery: (query) =>
      query.queryKey[0] !== "auth" && defaultShouldDehydrateQuery(query),
  });
}
