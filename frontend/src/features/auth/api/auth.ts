import "client-only";

import {
  userSchema,
  registerRequestSchema,
  type LoginInput,
  type RegisterInput,
} from "@/features/auth/schemas/auth";
import { httpClient } from "@/lib/api/http-client";

export async function login(input: LoginInput) {
  const response = await httpClient.post<unknown>("/auth/login", input);
  return userSchema.parse(response.data);
}

export async function register(input: RegisterInput) {
  const response = await httpClient.post<unknown>(
    "/auth/register",
    registerRequestSchema.parse(input),
  );
  return userSchema.parse(response.data);
}

export async function getProfile(signal?: AbortSignal) {
  const response = await httpClient.get<unknown>("/auth/profile", { signal });
  return userSchema.parse(response.data);
}

export async function logout() {
  await httpClient.post("/auth/logout");
}
