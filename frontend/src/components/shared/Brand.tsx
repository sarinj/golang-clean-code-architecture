import Link from "next/link";
import { Layers2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function Brand({
  inverse = false,
  href = "/dashboard",
}: {
  inverse?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex w-fit items-center gap-3",
        inverse ? "text-white" : "text-foreground",
      )}
      aria-label="Clean API home"
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-xl",
          inverse ? "bg-white/10" : "bg-primary text-primary-foreground",
        )}
      >
        <Layers2 className="size-5" aria-hidden="true" />
      </span>
      <span className="text-lg font-semibold tracking-tight">
        clean
        <span className={inverse ? "text-white/50" : "text-muted-foreground"}>
          api
        </span>
      </span>
    </Link>
  );
}
