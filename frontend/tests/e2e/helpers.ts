import { randomUUID } from "node:crypto";
import { expect, type APIRequestContext } from "@playwright/test";

import { userSchema } from "@/features/auth/schemas/auth";

export const appOrigin = new URL(
  process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001",
).origin;
export const password = "example-password";

export function uniqueEmail() {
  return `e2e-${randomUUID()}@example.com`;
}

export async function createAccount(request: APIRequestContext) {
  const email = uniqueEmail();
  const registration = await request.post("/api/auth/register", {
    headers: { Origin: appOrigin },
    data: { email, password, first_name: "Taylor", last_name: "Morgan" },
  });
  expect(registration.status()).toBe(201);
  const rawUser: unknown = await registration.json();
  const user = userSchema.parse(rawUser);
  const login = await request.post("/api/auth/login", {
    headers: { Origin: appOrigin },
    data: { email, password },
  });
  expect(login.status()).toBe(200);
  const body: unknown = await login.json();
  expect(body).not.toHaveProperty("token");
  expect(userSchema.parse(body).id).toBe(user.id);
  return user;
}
