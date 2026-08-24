import "dotenv/config";

// point tests at the test database - reuse whatever host/port we already
// have (works both locally and in CI), just swap the db name at the end
// of the url so we never accidentally touch the dev database
if (!process.env.DATABASE_URL?.includes("eventify_test")) {
  process.env.DATABASE_URL = process.env.DATABASE_URL?.replace(
    /\/[^/?]+(\?|$)/,
    "/eventify_test$1",
  );
}