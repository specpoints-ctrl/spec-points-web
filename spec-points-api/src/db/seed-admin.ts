import { db } from './config.js';

const activateAdminUser = async () => {
  try {
    // Update existing admin user to active status
    const result = await db.result(
      `UPDATE users 
       SET status = 'active', updated_at = NOW()
       WHERE firebase_uid = 'admin-test-user-12345'
       RETURNING id, firebase_uid, email, status`
    );

    if (result.rowCount > 0) {
      const user = result.rows[0];
      console.log('✅ Admin user activated successfully!');
      console.log(`   User ID: ${user.id}`);
      console.log(`   Firebase UID: ${user.firebase_uid}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Status: ${user.status}`);
    } else {
      console.log('❌ Admin user not found. Creating new one...');
      
      // Create new admin if doesn't exist
      const adminResult = await db.result(
        `INSERT INTO users (firebase_uid, email, status, created_at, updated_at)
         VALUES ('admin-test-user-12345', 'admin@specpoints.com', 'active', NOW(), NOW())
         RETURNING id, firebase_uid, email, status`
      );

      if (adminResult.rows.length > 0) {
        const newUser = adminResult.rows[0];
        console.log('✅ Admin user created successfully!');
        console.log(`   User ID: ${newUser.id}`);
        console.log(`   Firebase UID: ${newUser.firebase_uid}`);
        console.log(`   Email: ${newUser.email}`);
        console.log(`   Status: ${newUser.status}`);
      }
    }

    console.log('');
    console.log('Firebase credentials:');
    console.log('  Email: admin@specpoints.com');
    console.log('  Password: admin@123456');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

activateAdminUser().then(() => process.exit(0));
