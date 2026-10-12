"use client";

import { AlertCircle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { errorMessage } from "@/lib/api/error";

export function QueryError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-10 text-center"
    >
      <AlertCircle className="size-6 text-destructive" aria-hidden="true" />
      <p className="font-medium">We couldn&apos;t load this information.</p>
      <p className="max-w-md text-sm text-muted-foreground">
        {errorMessage(error)}
      </p>
      <Button variant="outline" onClick={retry}>
        <RotateCw aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}
