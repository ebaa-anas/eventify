import "dotenv/config";
// this makes sure every test run points at the test db, never the dev one
process.env.DATABASE_URL =
  "postgresql://eventify:eventify@localhost:5433/eventify_test";