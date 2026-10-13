"use client";

import Link from "next/link";
import { LoaderCircle, LogOut } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { SheetClose } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLogout, useProfile } from "@/features/auth/hooks/use-auth";
import { displayName, initials } from "@/features/auth/lib/user";

export function AccountMenu({
  closeOnNavigate = false,
}: {
  closeOnNavigate?: boolean;
}) {
  const profile = useProfile();
  const logout = useLogout();
  const profileLink = profile.data ? (
    <Link
      href="/profile"
      aria-label="View your profile"
      title="View your profile"
      className="flex min-w-0 items-center gap-3 rounded-lg p-1 hover:bg-muted"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/8 text-xs font-semibold text-primary">
        {initials(profile.data)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">
          {displayName(profile.data)}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {profile.data.email}
        </span>
      </span>
    </Link>
  ) : null;
  return (
    <div className="space-y-4">
      {profileLink ? (
        closeOnNavigate ? (
          <SheetClose asChild>{profileLink}</SheetClose>
        ) : (
          profileLink
        )
      ) : (
        <Skeleton className="h-10 w-full" />
      )}
      <Button
        variant="ghost"
        className="h-10 w-full justify-start text-muted-foreground"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
      >
        {logout.isPending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <LogOut aria-hidden="true" />
        )}
        {logout.isPending ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}
