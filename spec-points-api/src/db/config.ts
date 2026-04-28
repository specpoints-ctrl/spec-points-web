import pgPromise from 'pg-promise';

// Use console for db-level logs to avoid circular dependency with index.ts
const log = {
  debug: (msg: string) => process.env.LOG_LEVEL === 'debug' && console.debug('[db]', msg),
  error: (msg: string, ...args: unknown[]) => console.error('[db]', msg, ...args),
};

const pgp = pgPromise({
  query(e) {
    log.debug('Query: ' + e.query);
  },
  error(err, e) {
    log.error('Database error:', err);
    if (e.query) {
      log.error('Query:', e.query);
    }
  },
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const db = pgp(databaseUrl);

// Test connection
export const testConnection = async () => {
  try {
    await db.one('SELECT 1');
    log.error('Database connection established successfully');
    return true;
  } catch (error) {
    log.error('Failed to connect to database:' + error);
    return false;
  }
};

// Helper function for transactions
export const withTransaction = async <T>(
  callback: (tx: pgPromise.ITask<any>) => Promise<T>
): Promise<T> => {
  return db.tx(callback);
};
