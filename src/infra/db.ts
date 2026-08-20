import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";

const adapter = new PrismaPg({
  user: "eventify",
  password: "eventify",
  host: "localhost",
  port: 5433,
  database: "eventify",
});
export const prisma = new PrismaClient({ adapter });