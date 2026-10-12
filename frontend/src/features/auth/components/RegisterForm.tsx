"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { z } from "zod";

import { FormField } from "@/components/shared/FormField";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRegister } from "@/features/auth/hooks/use-auth";
import {
  registerFormSchema,
  type RegisterInput,
} from "@/features/auth/schemas/auth";
import { errorMessage } from "@/lib/api/error";

export function RegisterForm() {
  const register = useRegister();
  const form = useForm<
    z.input<typeof registerFormSchema>,
    unknown,
    RegisterInput
  >({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      confirm_password: "",
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await register.mutateAsync(values);
    } catch (error) {
      form.setError("root", { message: errorMessage(error) });
    }
  });

  return (
    <div className="w-full max-w-sm">
      <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
        Make yourself at home
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Your next workspace.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Create an account to get started.
      </p>
      <form onSubmit={onSubmit} noValidate className="mt-8">
        <fieldset disabled={register.isPending} className="space-y-4">
          <legend className="sr-only">Account details</legend>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              id="first_name"
              label="First name"
              error={errors.first_name?.message}
            >
              <Input
                id="first_name"
                autoComplete="given-name"
                placeholder="Alex"
                className="h-11"
                aria-invalid={!!errors.first_name}
                aria-describedby={
                  errors.first_name ? "first_name-error" : undefined
                }
                {...form.register("first_name")}
              />
            </FormField>
            <FormField
              id="last_name"
              label="Last name"
              error={errors.last_name?.message}
            >
              <Input
                id="last_name"
                autoComplete="family-name"
                placeholder="Lee"
                className="h-11"
                aria-invalid={!!errors.last_name}
                aria-describedby={
                  errors.last_name ? "last_name-error" : undefined
                }
                {...form.register("last_name")}
              />
            </FormField>
          </div>
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
              autoComplete="new-password"
              placeholder="Choose a password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...form.register("password")}
            />
          </FormField>
          <FormField
            id="confirm_password"
            label="Confirm password"
            error={errors.confirm_password?.message}
          >
            <PasswordInput
              id="confirm_password"
              autoComplete="new-password"
              placeholder="Enter it once more"
              aria-invalid={!!errors.confirm_password}
              aria-describedby={
                errors.confirm_password ? "confirm_password-error" : undefined
              }
              {...form.register("confirm_password")}
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
            className="mt-2 h-11 w-full justify-between px-4"
            disabled={register.isPending}
            aria-busy={register.isPending}
          >
            {register.isPending ? "Creating your account…" : "Create account"}
            {register.isPending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight aria-hidden="true" />
            )}
          </Button>
        </fieldset>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
