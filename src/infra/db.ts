import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";

// read the connection string from the environment instead of hardcoding
// it here - this is what lets the same code work against dev, the local
// test db, and CI's service container without any code changes
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });