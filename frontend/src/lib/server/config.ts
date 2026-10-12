import "server-only";

import { z } from "zod";

const environmentSchema = z.object({
  FASTAPI_URL: z.url({ protocol: /^https?$/ }).default("http://127.0.0.1:3000"),
  APP_ORIGIN: z.url({ protocol: /^https?$/ }).optional(),
  AUTH_COOKIE_SECURE: z.enum(["true", "false"]).optional(),
});

export function serverConfig() {
  const values = environmentSchema.parse(process.env);
  return {
    apiUrl: values.FASTAPI_URL.replace(/\/$/, ""),
    appOrigin: values.APP_ORIGIN
      ? new URL(values.APP_ORIGIN).origin
      : undefined,
    secureCookies: values.AUTH_COOKIE_SECURE
      ? values.AUTH_COOKIE_SECURE === "true"
      : process.env.NODE_ENV === "production",
  };
}
