"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Database, RotateCw } from "lucide-react";

import { QueryError } from "@/components/shared/QueryError";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { RecordsTable } from "@/features/data/components/RecordsTable";
import { resources } from "@/features/data/config/resources";
import { useRecords } from "@/features/data/hooks/use-data";
import {
  type Pagination,
  type ResourceSlug,
} from "@/features/data/schemas/data";
import { formatNumber } from "@/lib/format";

export function DataBrowser({
  resource,
  pagination,
}: {
  resource: ResourceSlug;
  pagination: Pagination;
}) {
  const router = useRouter();
  const [navigating, startTransition] = useTransition();
  const records = useRecords(resource, pagination);
  const busy = navigating || records.isPlaceholderData;
  const result = records.data;

  function changePage(next: Pagination) {
    const query = new URLSearchParams({
      page: String(next.page),
      pageSize: String(next.pageSize),
    });
    startTransition(() =>
      router.replace(`/data/${resource}?${query}`, { scroll: false }),
    );
  }

  if (records.isError)
    return (
      <QueryError error={records.error} retry={() => void records.refetch()} />
    );

  return (
    <section
      className="overflow-hidden rounded-xl border bg-card shadow-xs"
      aria-label={`${resources[resource].title} records`}
      aria-busy={records.isFetching || navigating}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-5">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold">
            All {resources[resource].title.toLowerCase()}
          </h2>
          <Badge variant="secondary">
            {result ? formatNumber(result.total_data) : "…"}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Refresh records"
          disabled={records.isFetching || navigating}
          onClick={() => void records.refetch()}
        >
          <RotateCw aria-hidden="true" />
        </Button>
      </div>
      <div className={busy ? "opacity-60" : undefined}>
        {records.isPending ? (
          <div
            className="space-y-5 border-y px-5 py-6"
            role="status"
            aria-label="Loading records"
          >
            {[0, 1, 2, 3, 4].map((row) => (
              <Skeleton key={row} className="h-10 w-full" />
            ))}
          </div>
        ) : result && result.data.length > 0 ? (
          <RecordsTable resource={resource} result={result} />
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 border-y p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Database
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </span>
            <h3 className="font-medium">
              {pagination.page > 1
                ? "No records on this page"
                : `No ${resources[resource].title.toLowerCase()} yet`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {pagination.page > 1
                ? "Choose an earlier page to see your records."
                : "Records will appear here when they are available."}
            </p>
            {pagination.page > 1 ? (
              <Button
                variant="outline"
                onClick={() => changePage({ ...pagination, page: 1 })}
              >
                Go to first page
              </Button>
            ) : null}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t px-5 py-4">
        <div className="flex items-center gap-3">
          <Label htmlFor="page-size" className="text-xs text-muted-foreground">
            Rows per page
          </Label>
          <select
            id="page-size"
            value={pagination.pageSize}
            disabled={busy}
            onChange={(event) =>
              changePage({ page: 1, pageSize: Number(event.target.value) })
            }
            className="h-9 rounded-lg border bg-background px-2 text-xs focus-visible:outline-2 focus-visible:outline-ring"
          >
            {[...new Set([10, 25, 50, 100, pagination.pageSize])]
              .sort((a, b) => a - b)
              .map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <p role="status" className="text-xs text-muted-foreground">
            Page {pagination.page} of{" "}
            {result ? Math.max(1, result.total_page) : "…"}
          </p>
          <Button
            variant="outline"
            size="icon-lg"
            aria-label="Previous page"
            disabled={pagination.page <= 1 || busy || !result}
            onClick={() =>
              changePage({ ...pagination, page: pagination.page - 1 })
            }
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon-lg"
            aria-label="Next page"
            disabled={!result || pagination.page >= result.total_page || busy}
            onClick={() =>
              changePage({ ...pagination, page: pagination.page + 1 })
            }
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}
