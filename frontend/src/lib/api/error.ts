import axios from "axios";
import { z } from "zod";

export const errorResponseSchema = z.object({
  message: z.string(),
  trace_id: z.string().optional(),
});

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError<unknown>(error)) {
    const parsed = errorResponseSchema.safeParse(error.response?.data);
    return new ApiError(
      error.response?.status ?? 503,
      parsed.success
        ? parsed.data.message
        : "Unable to reach the server. Please try again.",
    );
  }
  return new ApiError(500, "Something went wrong. Please try again.");
}

export function errorMessage(error: unknown): string {
  return normalizeError(error).message;
}
