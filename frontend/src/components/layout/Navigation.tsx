"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  KeyRound,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Users,
} from "lucide-react";

import { AccountMenu } from "@/components/layout/AccountMenu";
import { Brand } from "@/components/shared/Brand";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
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
  },
  { href: "/data/users", label: "Users", icon: Users },
  {
    href: "/data/user-permissions",
    label: "Permissions",
    icon: ShieldCheck,
  },
  { href: "/data/user-tokens", label: "Sessions", icon: KeyRound },
];

export function Navigation({ mobile = false }: { mobile?: boolean }) {
  const path = usePathname();
  return (
    <nav
      aria-label={mobile ? "Mobile navigation" : "Main navigation"}
      className="space-y-1"
    >
      {links.map(({ href, label, icon: Icon }) => {
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
      <SheetContent side="left" className="w-72 overflow-y-auto p-5">
        <SheetHeader className="p-0 pb-6">
          <SheetTitle>
            <Brand />
          </SheetTitle>
          <SheetDescription className="sr-only">
            Navigate the application
          </SheetDescription>
        </SheetHeader>
        <Navigation mobile />
        <div className="mt-auto pt-8">
          <Separator className="mb-5" />
          <AccountMenu closeOnNavigate />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function PageTitle() {
  const path = usePathname();
  const current = links.find(
    (item) => path === item.href || path.startsWith(`${item.href}/`),
  );
  return (
    <p className="text-sm">
      <span className="font-medium">
        {path === "/profile" ? "My profile" : (current?.label ?? "Overview")}
      </span>
    </p>
  );
}
