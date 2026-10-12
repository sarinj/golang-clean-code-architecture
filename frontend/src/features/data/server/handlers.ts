import "server-only";

import {
  dataListSchema,
  dataResponseSchema,
  paginationSchema,
  recordIdSchema,
  recordSchema,
  resourceSlugSchema,
} from "@/features/data/schemas/data";
import { redactRecord } from "@/features/data/lib/records";
import { ApiError } from "@/lib/api/error";
import { authenticatedRequest } from "@/lib/server/fastapi";
import { apiHandler, jsonResponse, parseResponse } from "@/lib/server/response";

function resourceSlug(value: string) {
  const result = resourceSlugSchema.safeParse(value);
  if (!result.success) throw new ApiError(404, "This resource does not exist.");
  return result.data;
}

export function listHandler(request: Request, resource: string) {
  return apiHandler(async () => {
    const slug = resourceSlug(resource);
    const search = new URL(request.url).searchParams;
    const pagination = paginationSchema.safeParse({
      page: search.get("page") ?? undefined,
      pageSize: search.get("pageSize") ?? undefined,
    });
    if (!pagination.success)
      throw new ApiError(400, "Invalid pagination parameters.");
    const query = new URLSearchParams({
      _page: String(pagination.data.page),
      _pageSize: String(pagination.data.pageSize),
    });
    const result = parseResponse(
      dataListSchema,
      await authenticatedRequest(`/data/${slug}/?${query}`),
    );
    return jsonResponse({ ...result, data: result.data.map(redactRecord) });
  });
}

export function recordHandler(resource: string, id: string) {
  return apiHandler(async () => {
    const slug = resourceSlug(resource);
    const identifier = recordIdSchema.safeParse(id);
    if (!identifier.success) throw new ApiError(400, "Invalid record ID.");
    const result = parseResponse(
      dataResponseSchema,
      await authenticatedRequest(`/data/${slug}/${identifier.data}`),
    );
    return jsonResponse({ ...result, data: redactRecord(result.data) });
  });
}

export function describeHandler(resource: string) {
  return apiHandler(async () => {
    const slug = resourceSlug(resource);
    return jsonResponse(
      parseResponse(
        recordSchema,
        await authenticatedRequest(`/data/${slug}/describe`),
      ),
    );
  });
}
