import "server-only";

import {
  dataListSchema,
  dataResponseSchema,
  type Pagination,
  type ResourceSlug,
} from "@/features/data/schemas/data";
import { redactRecord } from "@/features/data/lib/records";
import { authenticatedRequest } from "@/lib/server/fastapi";
import { parseResponse } from "@/lib/server/response";

export async function getServerRecords(
  resource: ResourceSlug,
  pagination: Pagination,
) {
  const query = new URLSearchParams({
    _page: String(pagination.page),
    _pageSize: String(pagination.pageSize),
  });
  const result = parseResponse(
    dataListSchema,
    await authenticatedRequest(`/data/${resource}/?${query}`),
  );
  return { ...result, data: result.data.map(redactRecord) };
}

export async function getServerRecord(resource: ResourceSlug, id: string) {
  const result = parseResponse(
    dataResponseSchema,
    await authenticatedRequest(`/data/${resource}/${encodeURIComponent(id)}`),
  );
  return { ...result, data: redactRecord(result.data) };
}
