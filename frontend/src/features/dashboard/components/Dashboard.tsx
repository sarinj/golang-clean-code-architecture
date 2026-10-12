"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  KeyRound,
  RotateCw,
  ShieldCheck,
  Users,
} from "lucide-react";

import { QueryError } from "@/components/shared/QueryError";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { displayName } from "@/features/auth/lib/user";
import { useMonitor } from "@/features/dashboard/hooks/use-monitor";
import { resources, resourceSlugs } from "@/features/data/config/resources";
import { useRecords } from "@/features/data/hooks/use-data";
import { displayValue, recordId } from "@/features/data/lib/records";
import type { ResourceSlug } from "@/features/data/schemas/data";
import { formatDate, formatNumber } from "@/lib/format";

const resourceIcons = {
  users: Users,
  "user-tokens": KeyRound,
  "user-permissions": ShieldCheck,
};

function StatCard({ resource }: { resource: ResourceSlug }) {
  const result = useRecords(resource, {
    page: 1,
    pageSize: resource === "users" ? 5 : 1,
  });
  const Icon = resourceIcons[resource];
  return (
    <section className="rounded-xl border bg-card p-5 shadow-xs sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {resources[resource].title}
        </p>
        <Icon
          className="size-[18px] text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      {result.isPending ? (
        <Skeleton className="mt-5 h-9 w-16" />
      ) : result.isError ? (
        <Button
          className="mt-5"
          variant="outline"
          size="sm"
          onClick={() => void result.refetch()}
          aria-label={`Retry ${resources[resource].title.toLowerCase()}`}
        >
          <RotateCw aria-hidden="true" />
          Retry
        </Button>
      ) : (
        <p className="mt-4 text-3xl font-semibold tracking-tight">
          {formatNumber(result.data.total_data)}
        </p>
      )}
      <Link
        href={`/data/${resource}`}
        className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary"
      >
        View {resources[resource].title.toLowerCase()}
        <ArrowUpRight className="size-3.5" aria-hidden="true" />
      </Link>
    </section>
  );
}

function RecentUsers() {
  const users = useRecords("users", { page: 1, pageSize: 5 });
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="flex items-center justify-between border-b p-5">
        <div>
          <h2 className="font-semibold">Your users</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            A quick look at your account directory.
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/data/users">
            View all
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
      {users.isPending ? (
        <div className="space-y-5 p-5">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-11" />
          ))}
        </div>
      ) : users.isError ? (
        <div className="p-5">
          <QueryError error={users.error} retry={() => void users.refetch()} />
        </div>
      ) : users.data.data.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">
          No users yet.
        </p>
      ) : (
        <ul className="divide-y">
          {users.data.data.map((user, index) => {
            const id = recordId(user);
            const firstName =
              typeof user.first_name === "string" ? user.first_name : "";
            const lastName =
              typeof user.last_name === "string" ? user.last_name : "";
            const name =
              [firstName, lastName].filter(Boolean).join(" ") ||
              displayValue(user.email);
            return (
              <li
                key={id ?? index}
                className="flex min-w-0 items-center gap-3 px-5 py-4"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {displayValue(user.email)}
                  </p>
                </div>
                <span className="ml-auto hidden shrink-0 text-xs text-muted-foreground sm:inline">
                  {typeof user.created_at === "string"
                    ? formatDate(user.created_at)
                    : ""}
                </span>
                {id ? (
                  <Button variant="ghost" size="icon" asChild>
                    <Link
                      href={`/data/users/${id}`}
                      aria-label={`View ${name}`}
                    >
                      <ArrowUpRight aria-hidden="true" />
                    </Link>
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function Dashboard() {
  const profile = useProfile();
  const monitor = useMonitor();
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-[#172e32] px-6 py-7 text-white sm:px-8 sm:py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full border border-white/10 bg-white/3"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <Badge
              className="border-white/15 bg-white/8 text-white/80"
              variant="outline"
            >
              Your workspace
            </Badge>
            <h2 className="mt-3 text-xl font-medium tracking-tight">
              {profile.data
                ? `Hello, ${displayName(profile.data)}.`
                : "Everything in one place."}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Keep an eye on your users, sessions, and permissions.
            </p>
          </div>
          <Button
            variant="secondary"
            asChild
            className="h-10 bg-white text-[#172e32] hover:bg-white/90"
          >
            <Link href="/data/users">
              Explore your data
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {resourceSlugs.map((resource) => (
          <StatCard key={resource} resource={resource} />
        ))}
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[1.8fr_1fr]">
        <RecentUsers />
        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-5 shadow-xs">
            <h2 className="font-semibold">Connection status</h2>
            <div className="mt-5 flex items-center gap-2">
              <span
                className={
                  monitor.isSuccess && !monitor.isError
                    ? "size-2 rounded-full bg-emerald-500"
                    : "size-2 rounded-full bg-amber-500"
                }
                aria-hidden="true"
              />
              <p className="text-sm font-medium">
                {monitor.isPending
                  ? "Checking connection…"
                  : monitor.isError
                    ? "Service unavailable"
                    : "Connected"}
              </p>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {monitor.data && !monitor.isError
                ? "Your workspace is connected and ready."
                : "We will check the connection again shortly."}
            </p>
            {monitor.data && !monitor.isError ? (
              <div className="mt-5 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
                <span>Service version</span>
                <code>{monitor.data.version}</code>
              </div>
            ) : null}
          </section>
          <section className="rounded-xl border bg-card p-5 shadow-xs">
            <h2 className="font-semibold">Account details</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              See your personal information and manage your current session.
            </p>
            <Button
              variant="outline"
              asChild
              className="mt-4 w-full justify-between"
            >
              <Link href="/profile">
                My profile
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
