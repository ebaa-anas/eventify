import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../errors/HttpError.ts";

type Role = "ATTENDEE" | "ORGANIZER" | "ADMIN";

export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(HttpError.unauthorized("Not authenticated"));
      return;
    }
    if (!allowed.includes(req.user.role)) {
      next(HttpError.forbidden("Insufficient role"));
      return;
    }
    next();
  };
}