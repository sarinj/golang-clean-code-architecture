import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProfileView } from "@/features/profile/components/ProfileView";
import { prefetchPage } from "@/lib/server/queryClient";

export const metadata: Metadata = { title: "My profile" };

export default async function ProfilePage() {
  const state = await prefetchPage("/profile");
  return (
    <HydrationBoundary state={state}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Account"
          title="My profile"
          description="Your personal details and current session."
        />
        <ProfileView />
      </div>
    </HydrationBoundary>
  );
}
