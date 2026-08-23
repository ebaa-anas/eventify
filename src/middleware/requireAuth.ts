import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../errors/HttpError.ts";
import { verifyAccessToken, type AccessTokenPayload } from "../security/jwt.ts";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(HttpError.unauthorized("Missing or invalid Authorization header"));
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(HttpError.unauthorized("Invalid or expired token"));
  }
}