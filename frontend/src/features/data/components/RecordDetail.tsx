"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { QueryError } from "@/components/shared/QueryError";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useRecord } from "@/features/data/hooks/use-data";
import { displayValue, fieldLabel } from "@/features/data/lib/records";
import type { ResourceSlug } from "@/features/data/schemas/data";
import { formatDate } from "@/lib/format";

export function RecordDetail({
  resource,
  id,
}: {
  resource: ResourceSlug;
  id: string;
}) {
  const record = useRecord(resource, id);
  if (record.isPending)
    return <Skeleton className="h-96" aria-label="Loading record" />;
  if (record.isError)
    return (
      <QueryError error={record.error} retry={() => void record.refetch()} />
    );
  const result = record.data;

  async function copyRecord() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
      toast.success("Record copied.");
    } catch {
      toast.error("Could not copy the record. Please try again.");
    }
  }

  return (
    <section className="rounded-xl border bg-card p-5 shadow-xs sm:p-7">
      <div className="mb-7 flex items-center justify-between gap-3">
        <h2 className="font-semibold">Record details</h2>
        <Button variant="outline" onClick={() => void copyRecord()}>
          <Copy aria-hidden="true" />
          Copy JSON
        </Button>
      </div>
      <dl className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
        {result.data_schema.fields.map((field) => {
          const value = result.data[field.name];
          return (
            <div
              key={field.name}
              className={
                value !== null && typeof value === "object"
                  ? "sm:col-span-2"
                  : undefined
              }
            >
              <dt className="mb-2 text-xs text-muted-foreground">
                {fieldLabel(field.name)}
              </dt>
              <dd className="break-all text-sm">
                {value !== null && typeof value === "object" ? (
                  <pre
                    className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/40 p-4 text-xs leading-6"
                    tabIndex={0}
                  >
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : field.type === "datetime" && typeof value === "string" ? (
                  formatDate(value)
                ) : (
                  displayValue(value)
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
