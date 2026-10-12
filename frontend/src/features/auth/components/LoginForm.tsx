"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";

import { FormField } from "@/components/shared/FormField";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLogin } from "@/features/auth/hooks/use-auth";
import { loginSchema, type LoginInput } from "@/features/auth/schemas/auth";
import { errorMessage } from "@/lib/api/error";

export function LoginForm({ notice }: { notice?: string }) {
  const login = useLogin();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
    } catch (error) {
      form.setError("root", { message: errorMessage(error) });
    }
  });

  return (
    <div className="w-full max-w-sm">
      <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
        Your workspace awaits
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">Welcome back.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to see what&apos;s happening.
      </p>
      {notice ? (
        <p
          role="status"
          className="mt-6 rounded-lg border bg-muted p-3 text-sm"
        >
          {notice}
        </p>
      ) : null}
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <fieldset disabled={login.isPending} className="space-y-5">
          <legend className="sr-only">Sign in credentials</legend>
          <FormField
            id="email"
            label="Email address"
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="h-11"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...form.register("email")}
            />
          </FormField>
          <FormField
            id="password"
            label="Password"
            error={errors.password?.message}
          >
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...form.register("password")}
            />
          </FormField>
          {errors.root ? (
            <p
              role="alert"
              className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive"
            >
              {errors.root.message}
            </p>
          ) : null}
          <Button
            type="submit"
            className="h-11 w-full justify-between px-4"
            disabled={login.isPending}
            aria-busy={login.isPending}
          >
            {login.isPending ? "Signing in…" : "Sign in"}
            {login.isPending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight aria-hidden="true" />
            )}
          </Button>
        </fieldset>
      </form>
      <p className="mt-7 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
