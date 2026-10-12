import { monitorSchema } from "@/features/dashboard/schemas/monitor";
import { fastapiRequest } from "@/lib/server/fastapi";
import { apiHandler, jsonResponse, parseResponse } from "@/lib/server/response";

export function GET() {
  return apiHandler(async () =>
    jsonResponse(parseResponse(monitorSchema, await fastapiRequest("/"))),
  );
}
