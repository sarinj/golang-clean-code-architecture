"use client";

import {
  CalendarDays,
  LoaderCircle,
  LogOut,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { QueryError } from "@/components/shared/QueryError";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useLogout, useProfile } from "@/features/auth/hooks/use-auth";
import { displayName, initials } from "@/features/auth/lib/user";
import { formatDate } from "@/lib/format";

export function ProfileView() {
  const profile = useProfile();
  const logout = useLogout();
  if (profile.isPending) return <PageSkeleton />;
  if (profile.isError)
    return (
      <QueryError error={profile.error} retry={() => void profile.refetch()} />
    );
  const user = profile.data;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.6fr]">
      <section className="rounded-xl border bg-card p-7 shadow-xs">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/8 text-xl font-semibold text-primary">
          {initials(user)}
        </div>
        <h2 className="mt-5 text-xl font-semibold tracking-tight">
          {displayName(user)}
        </h2>
        <p className="mt-1 break-all text-sm text-muted-foreground">
          {user.email}
        </p>
        <Badge variant="secondary" className="mt-4">
          <ShieldCheck aria-hidden="true" />
          Account #{user.id}
        </Badge>
        <div className="mt-7 space-y-3 border-t pt-5 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            Joined {formatDate(user.created_at)}
          </p>
          <p className="flex items-center gap-2">
            <Mail className="size-3.5" aria-hidden="true" />
            Email sign-in
          </p>
        </div>
      </section>
      <div className="space-y-6">
        <section className="rounded-xl border bg-card p-7 shadow-xs">
          <h2 className="font-semibold">Personal information</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The details associated with your account.
          </p>
          <dl className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {[
              { label: "First name", value: user.first_name || "Not provided" },
              { label: "Last name", value: user.last_name || "Not provided" },
              { label: "Email address", value: user.email },
              { label: "Last updated", value: formatDate(user.updated_at) },
            ].map((field) => (
              <div key={field.label}>
                <dt className="mb-2 text-xs text-muted-foreground">
                  {field.label}
                </dt>
                <dd className="break-all text-sm font-medium">{field.value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-7 shadow-xs">
          <div>
            <h2 className="text-sm font-semibold">Your session</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign out when you&apos;re finished.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            {logout.isPending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <LogOut aria-hidden="true" />
            )}
            Sign out
          </Button>
        </section>
      </div>
    </div>
  );
}
