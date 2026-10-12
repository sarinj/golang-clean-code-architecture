import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const search = await searchParams;
  const notice =
    search.registered === "1"
      ? "Your account is ready. Sign in to continue."
      : search.expired === "1"
        ? "Your session has expired. Please sign in again."
        : undefined;
  return <LoginForm notice={notice} />;
}
