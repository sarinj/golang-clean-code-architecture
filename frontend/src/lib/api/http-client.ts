import "client-only";

import axios from "axios";

import { normalizeError } from "@/lib/api/error";
import { sessionExpiredEvent } from "@/lib/api/sessionEvents";

const sessionClient = axios.create({ baseURL: "/api", timeout: 15_000 });
export const httpClient = axios.create({ baseURL: "/api", timeout: 15_000 });

let pendingRefresh: Promise<void> | null = null;

async function refreshSession(): Promise<void> {
  const refresh = async () => {
    await sessionClient.post("/auth/refresh");
  };
  if (typeof navigator !== "undefined" && navigator.locks) {
    await navigator.locks.request("clean-api-session-refresh", refresh);
  } else {
    await refresh();
  }
}

export function coordinatedRefresh(): Promise<void> {
  pendingRefresh ??= refreshSession().finally(() => {
    pendingRefresh = null;
  });
  return pendingRefresh;
}

const publicAuthPaths = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/logout",
  "/auth/refresh",
]);

httpClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (
      axios.isAxiosError<unknown>(error) &&
      error.response?.status === 401 &&
      error.config &&
      !publicAuthPaths.has(error.config.url ?? "") &&
      error.config.headers.get("X-Session-Retry") !== "1"
    ) {
      try {
        await coordinatedRefresh();
      } catch (refreshError) {
        const failure = normalizeError(refreshError);
        if (failure.status === 401)
          window.dispatchEvent(new Event(sessionExpiredEvent));
        throw failure;
      }
      error.config.headers.set("X-Session-Retry", "1");
      return httpClient.request(error.config);
    }
    throw normalizeError(error);
  },
);
