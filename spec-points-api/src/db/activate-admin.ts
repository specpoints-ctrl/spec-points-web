import { db } from './config.js';

async function activateAdmin() {
  try {
    // Activate admin user
    const result = await db.result(
      'UPDATE users SET status = $1 WHERE email = $2',
      ['active', 'admin@specpoints.com']
    );

    console.log('✓ Admin user activated:', result.rowCount, 'row(s) updated');

    // Verify status
    const user = await db.oneOrNone(
      'SELECT id, email, status FROM users WHERE email = $1',
      ['admin@specpoints.com']
    );

    if (user) {
      console.log('✓ Current admin status:', user);
    } else {
      console.log('✗ Admin user not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('✗ Error activating admin:', error);
    process.exit(1);
  }
}

activateAdmin();
