import { createClient } from "redis";
import { createNodeRedisClient } from "bullmq";
import { config } from "../config.ts";

// BullMQ issues blocking commands — it needs its own client, never share with the cache client
const raw = createClient({ url: config.REDIS_URL });
await raw.connect();

export const connection = createNodeRedisClient(raw);