"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { coordinatedRefresh } from "@/lib/api/http-client";
import { ApiError, normalizeError } from "@/lib/api/error";

export function RefreshSession({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [failure, setFailure] = useState<ApiError | null>(null);

  useEffect(() => {
    let active = true;
    void coordinatedRefresh()
      .then(() => {
        if (active) {
          router.replace(returnTo);
          router.refresh();
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        const problem = normalizeError(error);
        if (problem.status === 401) router.replace("/login?expired=1");
        else setFailure(problem);
      });
    return () => {
      active = false;
    };
  }, [returnTo, router]);

  return (
    <div className="max-w-sm text-center">
      {failure ? (
        <>
          <h1 className="text-xl font-semibold">
            We couldn&apos;t restore your session.
          </h1>
          <p role="alert" className="mt-3 text-sm text-muted-foreground">
            {failure.message}
          </p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </>
      ) : (
        <>
          <LoaderCircle
            className="mx-auto mb-5 size-8 animate-spin text-primary"
            aria-hidden="true"
          />
          <h1 className="text-xl font-semibold">Restoring your session…</h1>
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            You&apos;ll be back in your workspace shortly.
          </p>
        </>
      )}
    </div>
  );
}
