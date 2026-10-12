import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError } from "@/lib/api/error";
import { serverConfig } from "@/lib/server/config";

export function jsonResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export function emptyResponse(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function apiHandler(
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    const failure =
      error instanceof ApiError
        ? error
        : new ApiError(503, "Unable to reach the API. Please try again.");
    return jsonResponse({ message: failure.message }, failure.status);
  }
}

export function requireSameOrigin(request: Request): void {
  const url = new URL(request.url);
  const host = request.headers.get("host");
  const expected =
    serverConfig().appOrigin ??
    (host ? new URL(`${url.protocol}//${host}`).origin : url.origin);
  if (request.headers.get("origin") !== expected) {
    throw new ApiError(403, "This request is not allowed.");
  }
}

export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new ApiError(400, "Send a JSON request body.");
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, "The request body is not valid JSON.");
  }
  const result = schema.safeParse(body);
  if (!result.success)
    throw new ApiError(
      400,
      result.error.issues.at(0)?.message ?? "Invalid request.",
    );
  return result.data;
}

export function parseResponse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success)
    throw new ApiError(502, "The API returned an unexpected response.");
  return result.data;
}
