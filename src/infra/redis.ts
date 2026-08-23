import { createClient } from "redis";
import { config } from "../config.ts";

export const redis = createClient({ url: config.REDIS_URL });
await redis.connect(); 