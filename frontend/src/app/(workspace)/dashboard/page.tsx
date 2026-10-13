import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Dashboard } from "@/features/dashboard/components/Dashboard";
import { dataKeys } from "@/features/data/api/queryKeys";
import { resourceSlugs } from "@/features/data/config/resources";
import { getServerRecords } from "@/features/data/server/data";
import { prefetchPage } from "@/lib/server/queryClient";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const state = await prefetchPage("/dashboard", [
    ...resourceSlugs.map((resource) => {
      const pagination = { page: 1, pageSize: resource === "users" ? 5 : 1 };
      return {
        queryKey: dataKeys.list(resource, pagination),
        queryFn: () => getServerRecords(resource, pagination),
      };
    }),
  ]);
  return (
    <HydrationBoundary state={state}>
      <div className="space-y-8">
        <PageHeader
          title="Overview"
          description="A closer look at your users, permissions, and sessions."
        />
        <Dashboard />
      </div>
    </HydrationBoundary>
  );
}
