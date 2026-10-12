import type { Config } from "drizzle-kit";
/** Durable B Social store (libSQL/Turso). Separate from drizzle.config.ts (the portfolio sql.js DB). */
export default {
  schema: "./src/persist/schema.ts",
  out: "./drizzle-persist",
  dialect: "turso",
  dbCredentials: { url: process.env.TURSO_DATABASE_URL || "file:./data/b-social.db", authToken: process.env.TURSO_AUTH_TOKEN },
} satisfies Config;
