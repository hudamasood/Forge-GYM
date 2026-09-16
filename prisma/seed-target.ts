/**
 * Decides whether a seed run may touch the database in DATABASE_URL.
 * Guards against the two costly mistakes: seeding the local database when
 * production was intended, and seeding production by accident.
 */

export interface SeedOptions {
  production: boolean;
  reset: boolean;
  demoAccounts: boolean;
  dryRun: boolean;
}

export interface SeedTarget {
  host: string;
  database: string;
  isLocal: boolean;
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "host.docker.internal"]);

export function parseSeedArgs(argv: string[]): SeedOptions {
  const has = (flag: string) => argv.includes(flag);
  const production = has("--production");
  return {
    production,
    reset: has("--reset"),
    // Demo logins use a published password, so production only gets them when explicitly asked.
    demoAccounts: production ? has("--with-demo-accounts") : !has("--no-demo-accounts"),
    dryRun: has("--dry-run"),
  };
}

/** Host and database name only — never credentials. */
export function describeTarget(databaseUrl: string | undefined): SeedTarget {
  if (!databaseUrl) throw new Error("DATABASE_URL is not set.");
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL is not a valid connection URL.");
  }
  const host = url.hostname;
  const database = url.pathname.replace(/^\//, "") || "(default)";
  return { host, database, isLocal: LOCAL_HOSTS.has(host) };
}

/** Throws with an actionable message when the flags and the target database disagree. */
export function assertSafeTarget(target: SeedTarget, options: SeedOptions) {
  if (options.production && target.isLocal) {
    throw new Error(
      `--production was passed but DATABASE_URL points at ${target.host}. ` +
        "Pull the production environment first (vercel env pull .env.production.local --environment=production).",
    );
  }
  if (!options.production && !target.isLocal) {
    throw new Error(`DATABASE_URL points at a remote database (${target.host}). Re-run with --production if that is intended.`);
  }
  if (options.reset && !target.isLocal) {
    throw new Error("--reset deletes every row and is only allowed against a local database.");
  }
}
