import type { Pagination, ResourceSlug } from "@/features/data/schemas/data";

export const dataKeys = {
  list: (resource: ResourceSlug, pagination: Pagination) => [
    "data",
    resource,
    "list",
    pagination,
  ],
  record: (resource: ResourceSlug, id: string) => [
    "data",
    resource,
    "record",
    id,
  ],
  schema: (resource: ResourceSlug) => ["data", resource, "schema"],
};
