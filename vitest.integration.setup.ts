import { readFileSync } from "node:fs";

// Load .env for local runs (CI provides DATABASE_URL directly).
if (!process.env.DATABASE_URL) {
  try {
    for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
    }
  } catch {
    // no .env file
  }
}

if (!process.env.DATABASE_URL) throw new Error("Integration tests need DATABASE_URL pointing at a migrated test database");
