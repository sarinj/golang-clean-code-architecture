import type { Metadata } from "next";
import { RefreshSession } from "@/features/auth/components/RefreshSession";
import { safeReturnPath } from "@/features/auth/lib/returnPath";

export const metadata: Metadata = { title: "Restoring session" };

export default async function RefreshPage({
  searchParams,
}: PageProps<"/session/refresh">) {
  const search = await searchParams;
  return (
    <RefreshSession
      returnTo={safeReturnPath(
        typeof search.returnTo === "string" ? search.returnTo : undefined,
      )}
    />
  );
}
