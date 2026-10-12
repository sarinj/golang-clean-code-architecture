"use client";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong.</h1>
      <p className="text-sm text-muted-foreground">
        Please try loading this page again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
