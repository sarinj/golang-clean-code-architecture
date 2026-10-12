import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Dashboard } from "@/features/dashboard/components/Dashboard";
import { monitorKey } from "@/features/dashboard/api/queryKeys";
import { getServerMonitor } from "@/features/dashboard/server/monitor";
import { dataKeys } from "@/features/data/api/queryKeys";
import { resourceSlugs } from "@/features/data/config/resources";
import { getServerRecords } from "@/features/data/server/data";
import { prefetchPage } from "@/lib/server/queryClient";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const state = await prefetchPage("/dashboard", [
    { queryKey: monitorKey, queryFn: getServerMonitor },
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
          eyebrow="Workspace"
          title="Workspace overview"
          description="A closer look at the people and activity in your workspace."
        />
        <Dashboard />
      </div>
    </HydrationBoundary>
  );
}
