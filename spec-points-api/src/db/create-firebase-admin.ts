import 'dotenv/config';
import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'spec-points-prod',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!firebaseConfig.projectId || !firebaseConfig.clientEmail || !firebaseConfig.privateKey) {
  console.error('Missing Firebase config. Make sure .env is loaded.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: firebaseConfig.projectId,
    clientEmail: firebaseConfig.clientEmail,
    privateKey: firebaseConfig.privateKey,
  }),
});

const createAdminInFirebase = async () => {
  try {
    console.log('Creating Firebase user for admin...');

    const user = await admin.auth().createUser({
      uid: 'admin-test-user-12345',
      email: 'admin@specpoints.com',
      password: 'admin@123456',
      displayName: 'Admin',
      emailVerified: true,
    });

    console.log('✅ Firebase admin user created successfully!');
    console.log(`   UID: ${user.uid}`);
    console.log(`   Email: ${user.email}`);
    console.log('');
    console.log('Login credentials:');
    console.log('  Email: admin@specpoints.com');
    console.log('  Password: admin@123456');
  } catch (error: any) {
    if (error.code === 'auth/uid-already-exists') {
      console.log('ℹ️  Admin user already exists in Firebase');
    } else {
      console.error('Error creating Firebase user:', error.message);
      process.exit(1);
    }
  }
};

createAdminInFirebase().then(() => process.exit(0));
