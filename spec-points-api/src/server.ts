// Load .env BEFORE any other module that reads process.env
// (ESM hoists all static imports so dotenv.config() in index.ts runs too late)
import 'dotenv/config';

import { app, logger } from './index.js';
import { testConnection } from './db/config.js';
import { runMigrations } from './db/migrate.js';

const PORT = Number(process.env.PORT || process.env.API_PORT || 3000);

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
