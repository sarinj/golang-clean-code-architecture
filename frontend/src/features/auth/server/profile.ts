import "server-only";

import { userSchema } from "@/features/auth/schemas/auth";
import { authenticatedRequest } from "@/lib/server/fastapi";
import { parseResponse } from "@/lib/server/response";

export async function getServerProfile() {
  return parseResponse(
    userSchema,
    await authenticatedRequest("/users/profile", "POST"),
  );
}
