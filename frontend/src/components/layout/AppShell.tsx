import type { ReactNode } from "react";
import Link from "next/link";

import { AccountMenu, MobileSignOut } from "@/components/layout/AccountMenu";
import { ApiStatus } from "@/components/layout/ApiStatus";
import {
  Breadcrumb,
  MobileNavigation,
  Navigation,
} from "@/components/layout/Navigation";
import { Brand } from "@/components/shared/Brand";
import { Separator } from "@/components/ui/Separator";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh">
      <a
        href="#main-content"
        className="sr-only fixed top-3 left-3 z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto border-r bg-card p-5 lg:flex">
        <div className="px-2 pt-2">
          <Brand />
        </div>
        <div className="mt-8 mb-7 flex items-center gap-3 rounded-xl border bg-background px-3 py-3">
          <span className="flex size-8 items-center justify-center rounded-lg border bg-card text-xs font-semibold">
            W
          </span>
          <div>
            <p className="text-sm font-medium">My workspace</p>
            <p className="text-[11px] text-muted-foreground">
              Default workspace
            </p>
          </div>
        </div>
        <Navigation />
        <div className="mt-auto pt-8">
          <Separator className="mb-5" />
          <AccountMenu />
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-card/95 px-4 backdrop-blur-sm sm:px-8 lg:px-10">
          <div className="lg:hidden">
            <MobileNavigation />
          </div>
          <Breadcrumb />
          <div className="ml-auto flex items-center gap-3">
            <ApiStatus />
            <MobileSignOut />
          </div>
        </header>
        <main
          id="main-content"
          className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:px-10 lg:py-10"
        >
          {children}
        </main>
        <footer className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-4 pb-6 text-[11px] text-muted-foreground sm:px-8 lg:px-10">
          <p>Clean API workspace</p>
          <Link href="/profile" className="underline-offset-4 hover:underline">
            Your account
          </Link>
        </footer>
      </div>
    </div>
  );
}
