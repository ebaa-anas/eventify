import type { ErrorRequestHandler } from "express";
import { HttpError } from "../errors/HttpError.ts";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: {
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  const status = getClientErrorStatus(err);
  if (status !== undefined) {
    res.status(status).json({ error: { message: "Bad request" } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: "Internal server error" } });
};

/**
 * Extracts a 4xx status from errors thrown by Express/body-parser (e.g.
 * malformed JSON, oversized bodies, bad URI escapes). These errors carry a
 * numeric `status` or `statusCode` property instead of being HttpError
 * instances.
 */
function getClientErrorStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) {
    return undefined;
  }

  const candidate =
    "status" in err
      ? err.status
      : "statusCode" in err
        ? err.statusCode
        : undefined;

  if (
    typeof candidate === "number" &&
    Number.isInteger(candidate) &&
    candidate >= 400 &&
    candidate < 500
  ) {
    return candidate;
  }

  return undefined;
}
