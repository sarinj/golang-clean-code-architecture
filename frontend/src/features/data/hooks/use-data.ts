"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  describeResource,
  getRecord,
  listRecords,
} from "@/features/data/api/data";
import { dataKeys } from "@/features/data/api/queryKeys";
import type { Pagination, ResourceSlug } from "@/features/data/schemas/data";

export function useRecords(resource: ResourceSlug, pagination: Pagination) {
  return useQuery({
    queryKey: dataKeys.list(resource, pagination),
    queryFn: ({ signal }) => listRecords(resource, pagination, signal),
    placeholderData: keepPreviousData,
  });
}

export function useRecord(resource: ResourceSlug, id: string) {
  return useQuery({
    queryKey: dataKeys.record(resource, id),
    queryFn: ({ signal }) => getRecord(resource, id, signal),
  });
}

export function useResourceSchema(resource: ResourceSlug, enabled: boolean) {
  return useQuery({
    queryKey: dataKeys.schema(resource),
    queryFn: ({ signal }) => describeResource(resource, signal),
    enabled,
    staleTime: 5 * 60_000,
  });
}
