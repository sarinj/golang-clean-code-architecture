import "client-only";

import { monitorSchema } from "@/features/dashboard/schemas/monitor";
import { httpClient } from "@/lib/api/http-client";

export async function getMonitor(signal?: AbortSignal) {
  const response = await httpClient.get<unknown>("/health", { signal });
  return monitorSchema.parse(response.data);
}
