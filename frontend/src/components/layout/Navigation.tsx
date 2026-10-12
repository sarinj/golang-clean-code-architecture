"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  KeyRound,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { Brand } from "@/components/shared/Brand";
import { Button } from "@/components/ui/Button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/Sheet";
import { cn } from "@/lib/utils";

const links = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    group: "workspace",
  },
  { href: "/data/users", label: "Users", icon: Users, group: "data" },
  {
    href: "/data/user-tokens",
    label: "Sessions",
    icon: KeyRound,
    group: "data",
  },
  {
    href: "/data/user-permissions",
    label: "Permissions",
    icon: ShieldCheck,
    group: "data",
  },
  { href: "/profile", label: "My profile", icon: UserRound, group: "account" },
];

export function Navigation({ mobile = false }: { mobile?: boolean }) {
  const path = usePathname();
  return (
    <nav
      aria-label={mobile ? "Mobile navigation" : "Main navigation"}
      className="space-y-7"
    >
      {[
        { key: "workspace", label: "Workspace" },
        { key: "data", label: "Data" },
        { key: "account", label: "Account" },
      ].map((group) => (
        <div key={group.key}>
          <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {group.label}
          </p>
          <div className="space-y-1">
            {links
              .filter((item) => item.group === group.key)
              .map(({ href, label, icon: Icon }) => {
                const active = path === href || path.startsWith(`${href}/`);
                const link = (
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-primary/8 font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-[18px]" aria-hidden="true" />
                    {label}
                    {active ? (
                      <span
                        className="ml-auto size-1.5 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                    ) : null}
                  </Link>
                );
                return mobile ? (
                  <SheetClose asChild key={href}>
                    {link}
                  </SheetClose>
                ) : (
                  <div key={href}>{link}</div>
                );
              })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function MobileNavigation() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" aria-label="Open navigation">
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-5">
        <SheetHeader className="p-0 pb-6">
          <SheetTitle>
            <Brand />
          </SheetTitle>
          <SheetDescription className="sr-only">
            Navigate your workspace
          </SheetDescription>
        </SheetHeader>
        <Navigation mobile />
      </SheetContent>
    </Sheet>
  );
}

export function Breadcrumb() {
  const path = usePathname();
  const current = links.find(
    (item) => path === item.href || path.startsWith(`${item.href}/`),
  );
  return (
    <p className="text-sm">
      <span className="hidden text-muted-foreground sm:inline">
        Workspace <span className="mx-3 text-border">/</span>
      </span>
      <span className="font-medium">{current?.label ?? "Workspace"}</span>
    </p>
  );
}
