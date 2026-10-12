import { describeHandler } from "@/features/data/server/handlers";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/data/[resource]/describe">,
) {
  const { resource } = await context.params;
  return describeHandler(resource);
}
