/**
 * Apply schema + RLS in one shot via the postgres client (avoids drizzle-kit's
 * introspection hang on slow links). Runs:
 *   1. the generated migration SQL (all tables/enums/indexes)
 *   2. policies.sql (extensions, RLS, triggers)
 * Idempotent-ish: migration uses CREATE TABLE (will error if already present),
 * so pass --skip-migration to run only policies.
 *
 * Usage: tsx src/apply.ts [--skip-migration]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, '..');
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error('No DIRECT_URL/DATABASE_URL');

const skipMigration = process.argv.includes('--skip-migration');
const reset = process.argv.includes('--reset');
const sql = postgres(url, { prepare: false, max: 1 });

// Prepend search_path to every block so bare `geography` resolves regardless of
// which pooled connection runs it (Supabase keeps PostGIS in `extensions`).
const SEARCH_PATH = 'set search_path to public, extensions;\n';

async function run(label: string, statements: string) {
  console.log(`\n▶ ${label}`);
  await sql.unsafe(SEARCH_PATH + statements);
  console.log(`  ✓ ${label} applied`);
}

async function main() {
  if (reset) {
    // Reset FIRST (this can cascade-drop PostGIS if it lived in public).
    await run(
      'reset public schema (DESTRUCTIVE)',
      `drop schema if exists public cascade; create schema public;
       grant all on schema public to postgres, anon, authenticated, service_role;`,
    );
  }

  // (Re)create PostGIS into the `extensions` schema AFTER any reset, and make it
  // durably visible to the app roles (fixes runtime geography queries too).
  await run(
    'ensure PostGIS + persistent search_path',
    `create schema if not exists extensions;
     create extension if not exists postgis with schema extensions;
     alter role authenticated set search_path = public, extensions;
     alter role anon set search_path = public, extensions;
     alter role service_role set search_path = public, extensions;`,
  );

  if (!skipMigration) {
    const migDir = join(pkgRoot, 'migrations');
    const migFile = readdirSync(migDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()[0];
    if (!migFile) throw new Error('No migration file found');
    let migrationSql = readFileSync(join(migDir, migFile), 'utf8');
    // Drizzle quotes custom types as one identifier: "geography(Point,4326)".
    // Unquote so Postgres parses it as the PostGIS type (found via search_path).
    migrationSql = migrationSql.replace(/"geography\(Point,4326\)"/g, 'geography(Point,4326)');
    await run(`migration ${migFile}`, migrationSql);
  }
  await run('policies.sql (RLS + triggers)', readFileSync(join(pkgRoot, 'policies.sql'), 'utf8'));
  console.log('\n✅ Done.');
  await sql.end();
  process.exit(0);
}
main().catch(async (e) => {
  console.error('\n❌ FAILED:', e.message);
  await sql.end();
  process.exit(1);
});
