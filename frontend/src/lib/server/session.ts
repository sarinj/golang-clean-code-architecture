import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

import type { TokenPair } from "@/features/auth/schemas/auth";
import { ApiError } from "@/lib/api/error";
import { serverConfig } from "@/lib/server/config";

export const sessionCookieNames = {
  access: "clean_api_access",
  refresh: "clean_api_refresh",
};

const expirationSchema = z.object({
  exp: z.number().int().positive().max(8_640_000_000_000),
});

function tokenExpiration(token: string): Date {
  // FastAPI verifies tokens. This payload only supplies the cookie's expiry.
  const payload = token.split(".").at(1);
  try {
    if (!payload) throw new Error("Missing token payload");
    const data: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    return new Date(expirationSchema.parse(data).exp * 1000);
  } catch {
    throw new ApiError(502, "The API returned an invalid session.");
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: serverConfig().secureCookies,
    sameSite: "lax",
    path: "/",
  } satisfies Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2];
}

export async function setSessionCookies(tokens: TokenPair): Promise<void> {
  const accessExpiry = tokenExpiration(tokens.access);
  const refreshExpiry = tokenExpiration(tokens.refresh);
  const jar = await cookies();
  const options = cookieOptions();
  jar.set(sessionCookieNames.access, tokens.access, {
    ...options,
    expires: accessExpiry,
  });
  jar.set(sessionCookieNames.refresh, tokens.refresh, {
    ...options,
    expires: refreshExpiry,
  });
}

export async function clearSessionCookies(): Promise<void> {
  const jar = await cookies();
  for (const name of Object.values(sessionCookieNames)) {
    jar.set(name, "", { ...cookieOptions(), expires: new Date(0), maxAge: 0 });
  }
}

export async function hasSessionCookie(): Promise<boolean> {
  return (await cookies()).has(sessionCookieNames.refresh);
}
