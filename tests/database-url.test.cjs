const fs = require("node:fs");
const ts = require("typescript");
const assert = require("node:assert/strict");
const { test } = require("node:test");
require.extensions[".ts"] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename,
);
const { runtimeDatabaseUrl } = require("../src/lib/database-url.ts");

test("Supabase transaction pooler enables Prisma compatibility and preserves credentials/options", () => {
  const raw = "postgresql://postgres.example:p%40ss%3Aword@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&schema=public&connection_limit=2";
  const before = new URL(raw);
  const after = new URL(runtimeDatabaseUrl(raw));
  assert.equal(after.searchParams.get("pgbouncer"), "true");
  for (const key of ["protocol", "username", "password", "hostname", "port", "pathname"]) assert.equal(after[key], before[key]);
  for (const key of ["sslmode", "schema", "connection_limit"]) assert.equal(after.searchParams.get(key), before.searchParams.get(key));
  assert.equal(runtimeDatabaseUrl(after.toString()), after.toString());
});

test("missing, false and duplicate pgbouncer settings are normalized only on known transaction pooler", () => {
  const base = "postgres://user:password@aws-1-test.pooler.supabase.com:6543/postgres";
  for (const query of ["", "?pgbouncer=false", "?pgbouncer=true&pgbouncer=false"]) {
    assert.deepEqual(new URL(runtimeDatabaseUrl(base + query)).searchParams.getAll("pgbouncer"), ["true"]);
  }
});

test("direct/session/local/other hosts and invalid configuration are left unchanged", () => {
  for (const value of [undefined, "", "invalid-url", "postgresql://user:pass@localhost:5432/db", "postgresql://user:pass@db.example.supabase.co:5432/postgres", "postgresql://user:pass@aws-0-test.pooler.supabase.com:5432/postgres", "postgresql://user:pass@pooler.supabase.com.attacker.test:6543/db", "postgresql://user:pass@other.test:6543/db"]) {
    assert.equal(runtimeDatabaseUrl(value), value);
  }
});
