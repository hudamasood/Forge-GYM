import { describe, expect, it } from "vitest";
import { assertSafeTarget, describeTarget, parseSeedArgs } from "./seed-target";

const local = describeTarget("postgresql://postgres:secret@localhost:5432/forge_app?schema=public");
const remote = describeTarget("postgres://user:secret@db.prisma.io:5432/postgres?sslmode=require");

describe("describeTarget", () => {
  it("reports host and database without credentials", () => {
    expect(local).toEqual({ host: "localhost", database: "forge_app", isLocal: true });
    expect(remote).toEqual({ host: "db.prisma.io", database: "postgres", isLocal: false });
    expect(JSON.stringify(remote)).not.toContain("secret");
  });

  it("understands Prisma Postgres (Accelerate) URLs", () => {
    expect(describeTarget("prisma+postgres://accelerate.prisma-data.net/?api_key=abc").isLocal).toBe(false);
  });

  it("fails clearly when DATABASE_URL is missing or malformed", () => {
    expect(() => describeTarget(undefined)).toThrow(/not set/);
    expect(() => describeTarget("not a url")).toThrow(/not a valid/);
  });
});

describe("parseSeedArgs", () => {
  it("creates demo accounts locally unless disabled", () => {
    expect(parseSeedArgs([]).demoAccounts).toBe(true);
    expect(parseSeedArgs(["--no-demo-accounts"]).demoAccounts).toBe(false);
  });

  it("never creates demo accounts in production unless asked", () => {
    expect(parseSeedArgs(["--production"]).demoAccounts).toBe(false);
    expect(parseSeedArgs(["--production", "--with-demo-accounts"]).demoAccounts).toBe(true);
  });
});

describe("assertSafeTarget", () => {
  it("allows local seeding without flags and remote seeding with --production", () => {
    expect(() => assertSafeTarget(local, parseSeedArgs([]))).not.toThrow();
    expect(() => assertSafeTarget(remote, parseSeedArgs(["--production"]))).not.toThrow();
  });

  it("refuses --production against localhost (production env not loaded)", () => {
    expect(() => assertSafeTarget(local, parseSeedArgs(["--production"]))).toThrow(/points at localhost/);
  });

  it("refuses a remote database without --production", () => {
    expect(() => assertSafeTarget(remote, parseSeedArgs([]))).toThrow(/remote database/);
  });

  it("refuses --reset anywhere but local", () => {
    expect(() => assertSafeTarget(remote, parseSeedArgs(["--production", "--reset"]))).toThrow(/only allowed against a local/);
  });
});
