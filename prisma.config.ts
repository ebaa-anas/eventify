import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrate: {
    seed: `node --experimental-strip-types prisma/seed.ts`,
    adapter: async () => {
      return new PrismaPg({ connectionString: process.env.DATABASE_URL });
    },
  },
});