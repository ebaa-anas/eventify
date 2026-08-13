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

  console.error(err);
  res.status(500).json({ error: { message: "Internal server error" } });
};
