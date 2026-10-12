import { z } from "zod";

export const monitorSchema = z.object({
  name: z.string(),
  version: z.string(),
});
