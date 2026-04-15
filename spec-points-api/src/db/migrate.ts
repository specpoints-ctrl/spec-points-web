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
        logger.info(`⏭  Skipping already applied migration: ${file}`);
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      logger.info(`Running migration: ${file}`);

      await db.tx(async (t) => {
        await t.none(sql);
        await t.none(`INSERT INTO schema_migrations (filename) VALUES ($1)`, [file]);
      });

      logger.info(`✓ Migration completed: ${file}`);
      ran++;
    }

    logger.info(`All migrations completed successfully (${ran} new, ${applied.size} skipped)`);
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
