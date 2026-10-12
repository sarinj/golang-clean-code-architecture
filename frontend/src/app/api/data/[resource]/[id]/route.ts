import { recordHandler } from "@/features/data/server/handlers";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/data/[resource]/[id]">,
) {
  const { resource, id } = await context.params;
  return recordHandler(resource, id);
}
