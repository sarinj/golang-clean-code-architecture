import "client-only";

import {
  dataListSchema,
  dataResponseSchema,
  recordSchema,
  type Pagination,
  type ResourceSlug,
} from "@/features/data/schemas/data";
import { httpClient } from "@/lib/api/http-client";

export async function listRecords(
  resource: ResourceSlug,
  pagination: Pagination,
  signal?: AbortSignal,
) {
  const response = await httpClient.get<unknown>(`/data/${resource}`, {
    params: pagination,
    signal,
  });
  return dataListSchema.parse(response.data);
}

export async function getRecord(
  resource: ResourceSlug,
  id: string,
  signal?: AbortSignal,
) {
  const response = await httpClient.get<unknown>(
    `/data/${resource}/${encodeURIComponent(id)}`,
    { signal },
  );
  return dataResponseSchema.parse(response.data);
}

export async function describeResource(
  resource: ResourceSlug,
  signal?: AbortSignal,
) {
  const response = await httpClient.get<unknown>(`/data/${resource}/describe`, {
    signal,
  });
  return recordSchema.parse(response.data);
}
