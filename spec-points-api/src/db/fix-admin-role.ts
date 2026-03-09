import 'dotenv/config';
import { db } from './config.js';

const fixAdminRole = async () => {
  try {
    // Find admin user
    const adminUser = await db.oneOrNone(
      `SELECT id, email FROM users WHERE email = 'admin@specpoints.com'`
    );

    if (!adminUser) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    // Check if has role
    const existingRole = await db.oneOrNone(
      `SELECT * FROM user_roles WHERE user_id = $1`,
      [adminUser.id]
    );

    if (existingRole) {
      // Update existing role to admin
      await db.none(
        `UPDATE user_roles SET role = 'admin' WHERE user_id = $1`,
        [adminUser.id]
      );
      console.log('✅ Updated admin role to admin');
    } else {
      // Insert new admin role
      await db.none(
        `INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin')`,
        [adminUser.id]
      );
      console.log('✅ Created admin role');
    }

    console.log(`   User: ${adminUser.email}`);
    console.log(`   Status: admin role confirmed`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixAdminRole().then(() => process.exit(0));
