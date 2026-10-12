import "server-only";

import { cookies } from "next/headers";

import { ApiError, errorResponseSchema } from "@/lib/api/error";
import { serverConfig } from "@/lib/server/config";
import { sessionCookieNames } from "@/lib/server/session";

type ApiRequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  accessToken?: string;
};

export async function fastapiRequest(
  path: string,
  options: ApiRequestOptions = {},
): Promise<unknown> {
  const response = await fetch(`${serverConfig().apiUrl}/api/v1${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.accessToken
        ? { Authorization: `Bearer ${options.accessToken}` }
        : {}),
    },
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
    redirect: "error",
  });
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(502, "The API returned an unexpected response.");
  }
  if (!response.ok) {
    const parsed = errorResponseSchema.safeParse(data);
    throw new ApiError(
      response.status,
      parsed.success ? parsed.data.message : "The API request failed.",
    );
  }
  return data;
}

export async function authenticatedRequest(
  path: string,
  method: "GET" | "POST" = "GET",
): Promise<unknown> {
  const accessToken = (await cookies()).get(sessionCookieNames.access)?.value;
  if (!accessToken) throw new ApiError(401, "Please sign in to continue.");
  return fastapiRequest(path, { method, accessToken });
}
