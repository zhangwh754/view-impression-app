import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { neon } from "@neondatabase/serverless";
import { loadEnvConfig } from "@next/env";
import { ProxyAgent, setGlobalDispatcher } from "undici";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(currentDirectory, "../..");
const migrationsDirectory = join(currentDirectory, "migrations");

loadEnvConfig(projectDirectory);

const proxyUrl =
  process.env.HTTPS_PROXY ??
  process.env.https_proxy ??
  process.env.HTTP_PROXY ??
  process.env.http_proxy;
if (proxyUrl) setGlobalDispatcher(new ProxyAgent(proxyUrl));

const connectionString =
  process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing POSTGRES_URL or DATABASE_URL env var");
}

const sql = neon(connectionString);

await sql`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;

const appliedRows = await sql`SELECT name FROM schema_migrations`;
const applied = new Set(appliedRows.map((row) => String(row.name)));
const files = (await readdir(migrationsDirectory))
  .filter((name) => /^\d+.*\.sql$/.test(name))
  .sort();

for (const name of files) {
  if (applied.has(name)) continue;

  const migration = await readFile(join(migrationsDirectory, name), "utf8");
  await sql.transaction([
    sql.query(migration),
    sql`
      INSERT INTO schema_migrations (name)
      VALUES (${name})
      ON CONFLICT (name) DO NOTHING
    `,
  ]);
  console.log(`Applied migration ${name}`);
}

console.log("Database migrations are up to date.");
