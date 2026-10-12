import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-[70svh] flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">
        404
      </p>
      <h1 className="text-2xl font-semibold">Page not found.</h1>
      <p className="text-sm text-muted-foreground">
        This page or resource does not exist.
      </p>
      <Button asChild>
        <Link href="/dashboard">Back to workspace</Link>
      </Button>
    </main>
  );
}
