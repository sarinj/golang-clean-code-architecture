import { listHandler } from "@/features/data/server/handlers";

export async function GET(
  request: Request,
  context: RouteContext<"/api/data/[resource]">,
) {
  const { resource } = await context.params;
  return listHandler(request, resource);
}
