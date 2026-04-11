// Load .env BEFORE anything else (ESM hoisting)
import 'dotenv/config';

import admin from 'firebase-admin';
import { db } from './config.js';

// ── Firebase Admin init ────────────────────────────────────────────────────
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'spec-points-prod',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!firebaseConfig.clientEmail || !firebaseConfig.privateKey) {
  console.error('❌ Missing Firebase config. Make sure .env is loaded.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: firebaseConfig.projectId,
    clientEmail: firebaseConfig.clientEmail,
    privateKey: firebaseConfig.privateKey,
  }),
});

// ── Helpers ────────────────────────────────────────────────────────────────
async function createFirebaseUser(email: string, password: string, uid: string, name: string) {
  try {
    const user = await admin.auth().createUser({
      uid,
      email,
      password,
      displayName: name,
      emailVerified: true,
    });
    console.log(`  ✅ Firebase user created: ${user.email} (${user.uid})`);
    return user;
  } catch (err: any) {
    if (err.code === 'auth/uid-already-exists' || err.code === 'auth/email-already-exists') {
      console.log(`  ℹ️  Firebase user already exists: ${email}`);
      return await admin.auth().getUserByEmail(email);
    }
    throw err;
  }
}

// ── Seed architect test account ────────────────────────────────────────────
async function seedArchitect() {
  const email = 'arquiteto@specpoints.com';
  const password = 'arquiteto@123456';
  const uid = 'test-architect-uid-001';
  const name = 'João Arquiteto';

  console.log('\n📐 Creating test ARCHITECT account...');
  const firebaseUser = await createFirebaseUser(email, password, uid, name);

  // Upsert user in DB
  const user = await db.one(
    `INSERT INTO users (firebase_uid, email, email_verified, status)
     VALUES ($1, $2, true, 'active')
     ON CONFLICT (firebase_uid) DO UPDATE
       SET status = 'active', email = EXCLUDED.email, updated_at = NOW()
     RETURNING id, email, status`,
    [firebaseUser.uid, email]
  );
  console.log(`  ✅ DB user: ${user.email} [${user.status}]`);

  // Upsert architect record
  const architect = await db.one(
    `INSERT INTO architects (name, email, phone, company, status, points_total, points_redeemed)
     VALUES ($1, $2, '(11) 99999-0001', 'Arquitetos Associados Ltda', 'active', 1500, 200)
     ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, status = 'active', updated_at = NOW()
     RETURNING id, name`,
    [name, email]
  );
  console.log(`  ✅ Architect record: ${architect.name} (id=${architect.id})`);

  // Upsert user_role
  await db.none(
    `INSERT INTO user_roles (user_id, role, architect_id)
     VALUES ($1, 'architect', $2)
     ON CONFLICT (user_id, role) DO UPDATE
       SET architect_id = EXCLUDED.architect_id`,
    [user.id, architect.id]
  );
  console.log(`  ✅ Role linked: architect → architect_id=${architect.id}`);

  console.log(`\n  🔑 Credentials: ${email} / ${password}`);
  return { user, architect };
}

// ── Seed lojista test account ──────────────────────────────────────────────
async function seedLojista() {
  const email = 'lojista@specpoints.com';
  const password = 'lojista@123456';
  const uid = 'test-lojista-uid-001';
  const name = 'Maria Lojista';

  console.log('\n🏪 Creating test LOJISTA account...');
  const firebaseUser = await createFirebaseUser(email, password, uid, name);

  // Upsert user in DB
  const user = await db.one(
    `INSERT INTO users (firebase_uid, email, email_verified, status)
     VALUES ($1, $2, true, 'active')
     ON CONFLICT (firebase_uid) DO UPDATE
       SET status = 'active', email = EXCLUDED.email, updated_at = NOW()
     RETURNING id, email, status`,
    [firebaseUser.uid, email]
  );
  console.log(`  ✅ DB user: ${user.email} [${user.status}]`);

  // Upsert store record
  const store = await db.one(
    `INSERT INTO stores (name, cnpj, email, phone, branch, city, state)
     VALUES ('Loja Teste SpecPoints', '00.000.000/0001-99', $1, '(11) 3000-0001', 'Filial Centro', 'São Paulo', 'SP')
     ON CONFLICT (cnpj) DO UPDATE
       SET name = EXCLUDED.name, email = EXCLUDED.email, updated_at = NOW()
     RETURNING id, name`,
    [email]
  );
  console.log(`  ✅ Store record: ${store.name} (id=${store.id})`);

  // Upsert user_role
  await db.none(
    `INSERT INTO user_roles (user_id, role, store_id)
     VALUES ($1, 'lojista', $2)
     ON CONFLICT (user_id, role) DO UPDATE
       SET store_id = EXCLUDED.store_id`,
    [user.id, store.id]
  );
  console.log(`  ✅ Role linked: lojista → store_id=${store.id}`);

  console.log(`\n  🔑 Credentials: ${email} / ${password}`);
  return { user, store };
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 SpecPoints — Seeding test accounts\n');
  console.log('════════════════════════════════════════');

  try {
    await seedArchitect();
    await seedLojista();

    console.log('\n════════════════════════════════════════');
    console.log('✅ All test accounts created successfully!\n');
    console.log('📋 Summary:');
    console.log('   Admin:      admin@specpoints.com     / admin@123456');
    console.log('   Arquiteto:  arquiteto@specpoints.com / arquiteto@123456');
    console.log('   Lojista:    lojista@specpoints.com   / lojista@123456');
    console.log('════════════════════════════════════════\n');
  } catch (error: any) {
    console.error('\n❌ Error seeding test accounts:', error.message);
    process.exit(1);
  }
}

main().then(() => process.exit(0));
