import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { neon } from "@neondatabase/serverless";
import nextEnv from "@next/env";
import { ProxyAgent, setGlobalDispatcher } from "undici";

const { loadEnvConfig } = nextEnv;

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

function splitSqlStatements(script) {
  const statements = [];
  let current = "";
  let dollarQuote = null;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = 0; index < script.length; index += 1) {
    const character = script[index];
    const nextCharacter = script[index + 1];

    if (inLineComment) {
      current += character;
      if (character === "\n") inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      current += character;
      if (character === "*" && nextCharacter === "/") {
        current += nextCharacter;
        index += 1;
        inBlockComment = false;
      }
      continue;
    }

    if (dollarQuote) {
      if (script.startsWith(dollarQuote, index)) {
        current += dollarQuote;
        index += dollarQuote.length - 1;
        dollarQuote = null;
      } else {
        current += character;
      }
      continue;
    }

    if (inSingleQuote) {
      current += character;
      if (character === "'" && nextCharacter === "'") {
        current += nextCharacter;
        index += 1;
      } else if (character === "'") {
        inSingleQuote = false;
      }
      continue;
    }

    if (inDoubleQuote) {
      current += character;
      if (character === '"' && nextCharacter === '"') {
        current += nextCharacter;
        index += 1;
      } else if (character === '"') {
        inDoubleQuote = false;
      }
      continue;
    }

    if (character === "-" && nextCharacter === "-") {
      current += character + nextCharacter;
      index += 1;
      inLineComment = true;
      continue;
    }

    if (character === "/" && nextCharacter === "*") {
      current += character + nextCharacter;
      index += 1;
      inBlockComment = true;
      continue;
    }

    if (character === "'") {
      current += character;
      inSingleQuote = true;
      continue;
    }

    if (character === '"') {
      current += character;
      inDoubleQuote = true;
      continue;
    }

    if (character === "$") {
      const match = script.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/);
      if (match) {
        dollarQuote = match[0];
        current += dollarQuote;
        index += dollarQuote.length - 1;
        continue;
      }
    }

    if (character === ";") {
      if (current.trim()) statements.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  if (current.trim()) statements.push(current.trim());
  return statements;
}

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
  const statements = splitSqlStatements(migration);
  await sql.transaction([
    ...statements.map((statement) => sql.query(statement)),
    sql`
      INSERT INTO schema_migrations (name)
      VALUES (${name})
      ON CONFLICT (name) DO NOTHING
    `,
  ]);
  console.log(`Applied migration ${name}`);
}

console.log("Database migrations are up to date.");
