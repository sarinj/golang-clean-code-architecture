import Link from "next/link";
import { HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { dataKeys } from "@/features/data/api/queryKeys";
import { RecordDetail } from "@/features/data/components/RecordDetail";
import { resources } from "@/features/data/config/resources";
import {
  recordIdSchema,
  resourceSlugSchema,
} from "@/features/data/schemas/data";
import { getServerRecord } from "@/features/data/server/data";
import { prefetchPage } from "@/lib/server/queryClient";

export default async function RecordPage({
  params,
}: PageProps<"/data/[resource]/[id]">) {
  const path = await params;
  const parsed = resourceSlugSchema.safeParse(path.resource);
  const identifier = recordIdSchema.safeParse(path.id);
  if (!parsed.success || !identifier.success) notFound();
  const resource = parsed.data;
  const id = identifier.data;
  const state = await prefetchPage(`/data/${resource}/${id}`, [
    {
      queryKey: dataKeys.record(resource, id),
      queryFn: () => getServerRecord(resource, id),
    },
  ]);
  return (
    <HydrationBoundary state={state}>
      <div className="space-y-8">
        <Button asChild variant="ghost" className="-ml-2 text-muted-foreground">
          <Link href={`/data/${resource}`}>
            <ArrowLeft aria-hidden="true" />
            Back to {resources[resource].title.toLowerCase()}
          </Link>
        </Button>
        <PageHeader
          eyebrow={resources[resource].title}
          title={`${resources[resource].singular} #${id}`}
          description="View the information stored for this record."
        />
        <RecordDetail resource={resource} id={id} />
      </div>
    </HydrationBoundary>
  );
}
