import "server-only";

import { monitorSchema } from "@/features/dashboard/schemas/monitor";
import { fastapiRequest } from "@/lib/server/fastapi";
import { parseResponse } from "@/lib/server/response";

export async function getServerMonitor() {
  return parseResponse(monitorSchema, await fastapiRequest("/"));
}
