import "server-only";

import { cookies } from "next/headers";

import {
  loginSchema,
  registerRequestSchema,
  loginResponseSchema,
  userSchema,
} from "@/features/auth/schemas/auth";
import { ApiError } from "@/lib/api/error";
import { authenticatedRequest, fastapiRequest } from "@/lib/server/fastapi";
import {
  apiHandler,
  emptyResponse,
  jsonResponse,
  parseBody,
  parseResponse,
  requireSameOrigin,
} from "@/lib/server/response";
import {
  clearSessionCookies,
  sessionCookieNames,
  setSessionCookies,
} from "@/lib/server/session";

export function loginHandler(request: Request) {
  return apiHandler(async () => {
    requireSameOrigin(request);
    const input = await parseBody(request, loginSchema);
    const result = parseResponse(
      loginResponseSchema,
      await fastapiRequest("/users/login", { method: "POST", body: input }),
    );
    await setSessionCookies(result.token);
    return jsonResponse(result.user);
  });
}

export function registerHandler(request: Request) {
  return apiHandler(async () => {
    requireSameOrigin(request);
    const input = await parseBody(request, registerRequestSchema);
    const result = parseResponse(
      userSchema,
      await fastapiRequest("/users/register", { method: "POST", body: input }),
    );
    return jsonResponse(result, 201);
  });
}

export function profileHandler() {
  return apiHandler(async () =>
    jsonResponse(
      parseResponse(
        userSchema,
        await authenticatedRequest("/users/profile", "POST"),
      ),
    ),
  );
}

export function refreshHandler(request: Request) {
  return apiHandler(async () => {
    requireSameOrigin(request);
    const jar = await cookies();
    const accessToken = jar.get(sessionCookieNames.access)?.value;
    if (accessToken) {
      try {
        await fastapiRequest("/users/profile", { method: "POST", accessToken });
        return emptyResponse();
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
      }
    }
    const refreshToken = jar.get(sessionCookieNames.refresh)?.value;
    if (!refreshToken) {
      await clearSessionCookies();
      throw new ApiError(
        401,
        "Your session has expired. Please sign in again.",
      );
    }
    try {
      const result = parseResponse(
        loginResponseSchema,
        await fastapiRequest("/users/refresh-token", {
          method: "POST",
          body: { refresh_token: refreshToken },
        }),
      );
      await setSessionCookies(result.token);
      return emptyResponse();
    } catch (error) {
      if (error instanceof ApiError && [400, 401].includes(error.status)) {
        await clearSessionCookies();
        throw new ApiError(
          401,
          "Your session has expired. Please sign in again.",
        );
      }
      throw error;
    }
  });
}

export function logoutHandler(request: Request) {
  return apiHandler(async () => {
    requireSameOrigin(request);
    const refreshToken = (await cookies()).get(
      sessionCookieNames.refresh,
    )?.value;
    if (refreshToken) {
      try {
        await fastapiRequest("/users/logout", {
          method: "POST",
          body: { refresh_token: refreshToken },
        });
      } catch (error) {
        if (!(error instanceof ApiError) || ![400, 401].includes(error.status))
          throw error;
      }
    }
    await clearSessionCookies();
    return emptyResponse();
  });
}
