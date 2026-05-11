/**
 * FILE: server/middleware/errorHandler.ts
 * PURPOSE: Global error middleware for consistent API responses
 */
import { Context, isHttpError } from "oak";

export async function errorHandler(ctx: Context, next: () => Promise<unknown>) {
  try {
    await next();
  } catch (err) {
    let status = 500;
    let code = "INTERNAL_ERROR";
    let message = "Something went wrong. Please try again or refresh the page.";

    if (isHttpError(err)) {
      status = err.status;
    }

    if (err.name === "AllKeysExhaustedError") {
      status = 429;
      code = "KEYS_EXHAUSTED";
      message = err.message;
    }

    console.error(`[${new Date().toISOString()}] ${ctx.request.method} ${ctx.request.url}:`, err);

    ctx.response.status = status;
    ctx.response.body = {
      error: true,
      code: code,
      message: message
    };
  }
}