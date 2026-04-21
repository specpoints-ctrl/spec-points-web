import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './config.js';
import { logger } from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, 'migrations');

const ensureMigrationsTable = async () => {
  await db.none(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `);
};

const getAppliedMigrations = async (): Promise<Set<string>> => {
  const rows = await db.any(`SELECT filename FROM schema_migrations`);
  return new Set(rows.map((r: { filename: string }) => r.filename));
};

const tableExists = async (table: string): Promise<boolean> => {
  const r = await db.oneOrNone(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  return !!r;
};

// Verifies that a migration's key objects actually exist in the DB.
// Returns false if the migration is recorded as applied but its objects are missing.
const verifyApplied = async (filename: string): Promise<boolean> => {
  switch (filename) {
    case '0006_campaigns_terms_registration.sql':
      return tableExists('campaigns');
    default:
      return true;
  }
};

export const runMigrations = async () => {
  try {
    logger.info('Running database migrations...');

    await ensureMigrationsTable();

    const applied = await getAppliedMigrations();

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) {
        // Verify the migration's objects actually exist — guards against incorrect baseline seeding
        if (!(await verifyApplied(file))) {
          logger.warn(`Migration ${file} is recorded as applied but objects are missing. Re-running...`);
          await db.none(`DELETE FROM schema_migrations WHERE filename = $1`, [file]);
          applied.delete(file);
          // fall through to run it
        } else {
          logger.info(`⏭  Skipping already applied migration: ${file}`);
          continue;
        }
      }

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      logger.info(`Running migration: ${file}`);

      try {
        await db.tx(async (t) => {
          await t.none(sql);
          await t.none(`INSERT INTO schema_migrations (filename) VALUES ($1)`, [file]);
        });
        logger.info(`✓ Migration completed: ${file}`);
        ran++;
      } catch (err: any) {
        // Objects already exist → migration ran before tracking was set up (baseline case)
        if (err.code === '42710' || err.code === '42P07') {
          logger.warn(`Migration ${file} objects already exist — recording as baseline`);
          await db.none(
            `INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING`,
            [file]
          );
        } else {
          throw err;
        }
      }
    }

    logger.info(`All migrations completed (${ran} new, ${applied.size} skipped)`);
  } catch (error) {
    logger.error('Migration error:', error);
    throw error;
  }
};

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      logger.info('Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration process failed:', error);
      process.exit(1);
    });
}
