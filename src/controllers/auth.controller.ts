import type { Request, Response } from "express";
import { signup, login, issueRefreshToken, refreshTokens } from "../services/auth.service.ts";
import { signAccessToken } from "../security/jwt.ts";
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH } from "../security/refreshToken.ts";
import { HttpError } from "../errors/HttpError.ts";
import type { SignupInput, LoginInput } from "../schemas/auth.schema.ts";

function setRefreshCookie(res: Response, raw: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE_NAME, raw, {
    httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: REFRESH_COOKIE_PATH,
    expires: expiresAt,
  });
}

export async function signupHandler(req: Request, res: Response) {
  const user = await signup(req.body as SignupInput);
  const accessToken = signAccessToken({ sub: user.id, role: user.role as "ATTENDEE" | "ORGANIZER" | "ADMIN" });
  const { raw, expiresAt } = await issueRefreshToken(user.id);
  setRefreshCookie(res, raw, expiresAt);
  res.status(201).json({ user, accessToken });
}

export async function loginHandler(req: Request, res: Response) {
  const user = await login(req.body as LoginInput);
  const accessToken = signAccessToken({ sub: user.id, role: user.role as "ATTENDEE" | "ORGANIZER" | "ADMIN" });
  const { raw, expiresAt } = await issueRefreshToken(user.id);
  setRefreshCookie(res, raw, expiresAt);
  res.status(200).json({ user, accessToken });
}

export async function refreshHandler(req: Request, res: Response) {
  const raw = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (!raw) {
    throw HttpError.unauthorized("Invalid or expired refresh token");
  }

  const { user, refreshToken } = await refreshTokens(raw);
  const accessToken = signAccessToken({ sub: user.id, role: user.role as "ATTENDEE" | "ORGANIZER" | "ADMIN" });
  setRefreshCookie(res, refreshToken.raw, refreshToken.expiresAt);
  res.status(200).json({ user, accessToken });
}