import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { dataKeys } from "@/features/data/api/queryKeys";
import { DataBrowser } from "@/features/data/components/DataBrowser";
import { SchemaDialog } from "@/features/data/components/SchemaDialog";
import { resources } from "@/features/data/config/resources";
import {
  paginationSchema,
  resourceSlugSchema,
} from "@/features/data/schemas/data";
import { getServerRecords } from "@/features/data/server/data";
import { prefetchPage } from "@/lib/server/queryClient";

export async function generateMetadata({
  params,
}: PageProps<"/data/[resource]">): Promise<Metadata> {
  const parsed = resourceSlugSchema.safeParse((await params).resource);
  return {
    title: parsed.success ? resources[parsed.data].title : "Resource not found",
  };
}

export default async function DataPage({
  params,
  searchParams,
}: PageProps<"/data/[resource]">) {
  const [path, search] = await Promise.all([params, searchParams]);
  const parsed = resourceSlugSchema.safeParse(path.resource);
  if (!parsed.success) notFound();
  const resource = parsed.data;
  const page = paginationSchema.safeParse({
    page: Array.isArray(search.page) ? search.page.at(0) : search.page,
    pageSize: Array.isArray(search.pageSize)
      ? search.pageSize.at(0)
      : search.pageSize,
  });
  const pagination = page.success ? page.data : { page: 1, pageSize: 10 };
  const query = new URLSearchParams({
    page: String(pagination.page),
    pageSize: String(pagination.pageSize),
  });
  const state = await prefetchPage(`/data/${resource}?${query}`, [
    {
      queryKey: dataKeys.list(resource, pagination),
      queryFn: () => getServerRecords(resource, pagination),
    },
  ]);
  return (
    <HydrationBoundary state={state}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Data browser"
          title={resources[resource].title}
          description={resources[resource].description}
          action={<SchemaDialog resource={resource} />}
        />
        <DataBrowser
          key={resource}
          resource={resource}
          pagination={pagination}
        />
      </div>
    </HydrationBoundary>
  );
}
