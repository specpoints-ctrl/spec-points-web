// Load .env BEFORE any other module that reads process.env
// (ESM hoists all static imports so dotenv.config() in index.ts runs too late)
import 'dotenv/config';

import { app, logger } from './index.js';
import { testConnection, db } from './db/config.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || process.env.API_PORT || 3000);

const runMigrations = async () => {
  const migrations = [
    '0001_initial_schema.sql',
    '0002_notifications_profiles.sql',
    '0003_architect_extended_fields.sql',
    '0004_seed_prizes_sales.sql',
    '0005_store_logo.sql',
  ];
  for (const file of migrations) {
    try {
      const sql = readFileSync(join(__dirname, 'db/migrations', file), 'utf8');
      await db.none(sql);
      logger.info(`Migration applied: ${file}`);
    } catch (err: any) {
      // Ignore "already exists" errors from idempotent DDL
      if (err.message?.includes('already exists') || err.code === '42P07' || err.code === '42710') {
        logger.info(`Migration skipped (already applied): ${file}`);
      } else {
        logger.warn(`Migration warning for ${file}: ${err.message}`);
      }
    }
  }
};

// Test database connection before starting server
const startServer = async () => {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      logger.error('Failed to connect to database. Server will not start.');
      process.exit(1);
    }

    // Run migrations
    logger.info('Running database migrations...');
    await runMigrations();

    // Start server
    app.listen(PORT, () => {
      logger.info(`SpecPoints API listening on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Database: Connected ✓`);
      logger.info(`Firebase: Initialized ✓`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
