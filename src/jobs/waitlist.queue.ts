import { Queue } from "bullmq";
import { connection } from "../infra/queue-backend.ts";

export const waitlistQueue = new Queue("waitlist-promote", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000, jitter: 0.5 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});