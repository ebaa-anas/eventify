import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app.ts";
import { resetDb } from "./helpers.ts";

describe("Auth: signup, login, refresh rotation", () => {
  beforeEach(resetDb);

  const credentials = {
    email: "auth-test@test.com",
    name: "Auth Test User",
    password: "a-very-long-password-123",
  };

  it("signs up and logs in, returning a user and an access token", async () => {
    const signupRes = await request(app)
      .post("/v1/auth/signup")
      .send(credentials)
      .expect(201);

    expect(signupRes.body.user.email).toBe(credentials.email);
    expect(signupRes.body.accessToken).toBeTypeOf("string");
    // never leak the password hash back to the client
    expect(signupRes.body.user.passwordHash).toBeUndefined();

    const loginRes = await request(app)
      .post("/v1/auth/login")
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);

    expect(loginRes.body.accessToken).toBeTypeOf("string");
  });

  it("rotates the refresh token and rejects reuse of the old one", async () => {
    const signupRes = await request(app)
      .post("/v1/auth/signup")
      .send(credentials)
      .expect(201);

    // the refresh token lives in an httpOnly cookie, not the body
    const originalCookie = signupRes.headers["set-cookie"];
    expect(originalCookie).toBeDefined();

    // use the cookie to get a fresh access token - this should rotate it
    const refreshRes = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", originalCookie)
      .expect(200);

    expect(refreshRes.body.accessToken).toBeTypeOf("string");


    // the old cookie was replaced - using it again means reuse of a
    // revoked token, which must be rejected
    await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", originalCookie)
      .expect(401);
  });
});
