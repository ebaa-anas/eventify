import { Router } from "express";
import { validate } from "../middleware/validate.ts";
import { signupSchema, loginSchema } from "../schemas/auth.schema.ts";
import { signupHandler, loginHandler, refreshHandler } from "../controllers/auth.controller.ts";

export const authRouter = Router();

authRouter.post("/signup", validate(signupSchema), signupHandler);
authRouter.post("/login", validate(loginSchema), loginHandler);
authRouter.post("/refresh", refreshHandler);