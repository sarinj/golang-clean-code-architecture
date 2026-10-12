import type { ReactNode } from "react";
import { KeyRound, ShieldCheck, Users } from "lucide-react";

import { Brand } from "@/components/shared/Brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-svh lg:grid-cols-[0.95fr_1.05fr]">
      <section className="relative hidden flex-col overflow-hidden bg-[#172e32] p-12 text-white lg:flex xl:p-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(93,155,124,0.25),transparent_65%)]"
        />
        <div className="relative">
          <Brand inverse href="/login" />
        </div>
        <div className="relative my-auto max-w-md py-16">
          <p className="mb-6 flex items-center gap-2 text-[11px] tracking-[0.18em] text-white/50 uppercase">
            <span
              className="size-1.5 rounded-full bg-[#a0cfb0]"
              aria-hidden="true"
            />
            A little more clarity
          </p>
          <h2 className="text-4xl leading-[1.15] font-medium tracking-tight xl:text-5xl">
            A clear view of
            <br />
            your workspace.
          </h2>
          <p className="mt-6 max-w-xs text-sm leading-7 text-white/60">
            Your accounts, sessions, and permissions. One place to keep track.
          </p>
          <div className="mt-12 space-y-3">
            {[
              {
                icon: Users,
                title: "Your people",
                text: "See every account in your workspace.",
              },
              {
                icon: KeyRound,
                title: "Your sessions",
                text: "Keep track of current sign-ins.",
              },
              {
                icon: ShieldCheck,
                title: "Your access",
                text: "Browse account permission records.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/3 p-4"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-white/5">
                  <Icon
                    className="size-[18px] text-[#b5d4c4]"
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-1 text-xs text-white/45">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/40">Clean API workspace</p>
      </section>
      <section className="flex min-h-svh flex-col bg-card px-6 py-8 sm:px-12">
        <div className="lg:hidden">
          <Brand href="/login" />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          {children}
        </div>
        <p className="text-center text-[11px] text-muted-foreground">
          Your workspace, connected.
        </p>
      </section>
    </main>
  );
}
