"use client";

import { useState } from "react";
import { Braces } from "lucide-react";

import { QueryError } from "@/components/shared/QueryError";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { resources } from "@/features/data/config/resources";
import { useResourceSchema } from "@/features/data/hooks/use-data";
import type { ResourceSlug } from "@/features/data/schemas/data";

export function SchemaDialog({ resource }: { resource: ResourceSlug }) {
  const [open, setOpen] = useState(false);
  const schema = useResourceSchema(resource, open);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-10">
          <Braces aria-hidden="true" />
          View schema
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{resources[resource].title} schema</DialogTitle>
          <DialogDescription>
            The fields and types returned for this resource.
          </DialogDescription>
        </DialogHeader>
        {schema.isPending ? (
          <Skeleton className="h-72" />
        ) : schema.isError ? (
          <QueryError
            error={schema.error}
            retry={() => void schema.refetch()}
          />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <code className="text-xs text-muted-foreground">
                {schema.data.name}
              </code>
              <Badge variant="secondary">
                {schema.data.fields.length} fields
              </Badge>
            </div>
            <pre
              className="max-h-[60svh] overflow-auto rounded-lg border bg-muted/50 p-4 text-xs leading-6"
              tabIndex={0}
              aria-label="Resource schema"
            >
              <code>{JSON.stringify(schema.data, null, 2)}</code>
            </pre>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
