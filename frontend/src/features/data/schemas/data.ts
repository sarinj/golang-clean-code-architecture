import { z } from "zod";

export const resourceSlugSchema = z.enum([
  "users",
  "user-tokens",
  "user-permissions",
]);
export const dataRecordSchema = z.record(z.string(), z.json());
export const recordSchema = z.object({
  type: z.literal("record"),
  name: z.string(),
  fields: z.array(
    z.object({
      name: z.string(),
      type: z.json(),
      fields: z.json().optional(),
    }),
  ),
});

export const dataResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: dataRecordSchema,
  data_schema: recordSchema,
});

export const dataListSchema = dataResponseSchema.extend({
  data: z.array(dataRecordSchema),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
  total_page: z.number().int().nonnegative(),
  total_data: z.number().int().nonnegative(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const recordIdSchema = z
  .string()
  .regex(/^[1-9]\d{0,18}$/, "Invalid record ID.");

export type ResourceSlug = z.infer<typeof resourceSlugSchema>;
export type DataRecord = z.infer<typeof dataRecordSchema>;
export type DataList = z.infer<typeof dataListSchema>;
export type RecordSchema = z.infer<typeof recordSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type JsonValue = z.infer<ReturnType<typeof z.json>>;
