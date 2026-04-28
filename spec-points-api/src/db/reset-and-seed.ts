// Load .env BEFORE anything else
import 'dotenv/config';

import admin from 'firebase-admin';
import { db } from './config.js';

const FORCE = process.argv.includes('--force');
const IS_PROD = process.env.NODE_ENV === 'production';

if (IS_PROD && !FORCE) {
  console.error('❌  NODE_ENV=production. Use --force to override.');
  process.exit(1);
}

// ── Firebase Admin init ───────────────────────────────────────────────────
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID ?? 'spec-points-prod',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!firebaseConfig.clientEmail || !firebaseConfig.privateKey) {
  console.error('❌  Firebase env vars missing (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY).');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount),
});

// ── Helpers ───────────────────────────────────────────────────────────────
async function upsertFirebaseUser(
  uid: string,
  email: string,
  password: string,
  displayName: string,
) {
  try {
    const user = await admin.auth().createUser({ uid, email, password, displayName, emailVerified: true });
    console.log(`  ✅ Firebase user created: ${email}`);
    return user;
  } catch (err: any) {
    if (err.code === 'auth/uid-already-exists' || err.code === 'auth/email-already-exists') {
      console.log(`  ℹ️  Firebase user already exists: ${email}`);
      return admin.auth().getUserByEmail(email);
    }
    throw err;
  }
}

// ── Phase 1: TRUNCATE all tables ─────────────────────────────────────────
async function truncateAll() {
  console.log('\n🗑️  Truncating all tables...');
  await db.none(`
    TRUNCATE TABLE
      campaign_sales,
      campaign_prizes,
      campaigns,
      user_terms_acceptance,
      terms,
      notification_reads,
      notifications,
      security_audit_log,
      admin_approvals,
      login_attempts,
      redemptions,
      sales,
      user_roles,
      prizes,
      architects,
      stores,
      users,
      dashboard_configs
    RESTART IDENTITY CASCADE
  `);
  console.log('  ✅ All tables truncated and sequences reset.');
}

// ── Phase 2: Seed Admin ───────────────────────────────────────────────────
async function seedAdmin() {
  console.log('\n👑 Seeding ADMIN...');
  const email    = 'admin@specpoints.com';
  const password = 'admin@123456';
  const uid      = 'admin-test-user-12345';
  const name     = 'Admin SpecPoints';

  const fbUser = await upsertFirebaseUser(uid, email, password, name);

  const user = await db.one(
    `INSERT INTO users (firebase_uid, email, email_verified, display_name, status)
     VALUES ($1, $2, true, $3, 'active')
     ON CONFLICT (firebase_uid) DO UPDATE
       SET status = 'active', email = EXCLUDED.email, updated_at = NOW()
     RETURNING id, email, status`,
    [fbUser.uid, email, name],
  );

  await db.none(
    `INSERT INTO user_roles (user_id, role)
     VALUES ($1, 'admin')
     ON CONFLICT (user_id, role) DO NOTHING`,
    [user.id],
  );

  console.log(`  ✅ Admin: ${user.email} [${user.status}]`);
  return user;
}

// ── Phase 3: Seed Architect ───────────────────────────────────────────────
async function seedArchitect() {
  console.log('\n📐 Seeding ARCHITECT...');
  const email    = 'arquiteto@specpoints.com';
  const password = 'arquiteto@123456';
  const uid      = 'test-architect-uid-001';
  const name     = 'João Arquiteto';

  const fbUser = await upsertFirebaseUser(uid, email, password, name);

  const user = await db.one(
    `INSERT INTO users (firebase_uid, email, email_verified, display_name, status)
     VALUES ($1, $2, true, $3, 'active')
     ON CONFLICT (firebase_uid) DO UPDATE
       SET status = 'active', email = EXCLUDED.email, updated_at = NOW()
     RETURNING id, email, status`,
    [fbUser.uid, email, name],
  );

  const architect = await db.one(
    `INSERT INTO architects
       (name, email, phone, telefone, company, document_ci, ruc, birthday,
        address, city, state, cep, neighborhood, status,
        points_total, points_redeemed, profile_complete)
     VALUES
       ($1, $2, '(11) 99999-0001', '(11) 99999-0001', 'Arquitetos Associados Ltda',
        '12345678', 'RUC-TEST-001', '1990-01-15',
        'Rua Teste 123', 'São Paulo', 'SP', '01310-100', 'Centro',
        'active', 1500, 0, true)
     ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, status = 'active',
           profile_complete = true, points_total = 1500, points_redeemed = 0,
           updated_at = NOW()
     RETURNING id, name`,
    [name, email],
  );

  await db.none(
    `INSERT INTO user_roles (user_id, role, architect_id)
     VALUES ($1, 'architect', $2)
     ON CONFLICT (user_id, role) DO UPDATE SET architect_id = EXCLUDED.architect_id`,
    [user.id, architect.id],
  );

  console.log(`  ✅ Architect: ${user.email} → architect_id=${architect.id} | 1500 pts`);
  return { user, architect };
}

// ── Phase 4: Seed Lojista ─────────────────────────────────────────────────
async function seedLojista() {
  console.log('\n🏪 Seeding LOJISTA...');
  const email    = 'lojista@specpoints.com';
  const password = 'lojista@123456';
  const uid      = 'test-lojista-uid-001';
  const name     = 'Maria Lojista';

  const fbUser = await upsertFirebaseUser(uid, email, password, name);

  const user = await db.one(
    `INSERT INTO users (firebase_uid, email, email_verified, display_name, status)
     VALUES ($1, $2, true, $3, 'active')
     ON CONFLICT (firebase_uid) DO UPDATE
       SET status = 'active', email = EXCLUDED.email, updated_at = NOW()
     RETURNING id, email, status`,
    [fbUser.uid, email, name],
  );

  const store = await db.one(
    `INSERT INTO stores
       (name, cnpj, email, phone, branch, address, city, state, country,
        owner_name, owner_ci, ruc, profile_complete, status)
     VALUES
       ('Loja Teste SpecPoints', '00.000.000/0001-99', $1,
        '(11) 3000-0001', 'Filial Centro', 'Av. Paulista 1000', 'São Paulo', 'SP', 'Brasil',
        'Carlos Owner', '87654321', 'RUC-STORE-001', true, 'active')
     ON CONFLICT (cnpj) DO UPDATE
       SET name = EXCLUDED.name, email = EXCLUDED.email,
           profile_complete = true, status = 'active', updated_at = NOW()
     RETURNING id, name`,
    [email],
  );

  await db.none(
    `INSERT INTO user_roles (user_id, role, store_id)
     VALUES ($1, 'lojista', $2)
     ON CONFLICT (user_id, role) DO UPDATE SET store_id = EXCLUDED.store_id`,
    [user.id, store.id],
  );

  console.log(`  ✅ Lojista: ${user.email} → store_id=${store.id}`);
  return { user, store };
}

// ── Phase 5: Seed Prizes ──────────────────────────────────────────────────
async function seedPrizes() {
  console.log('\n🏆 Seeding prizes...');

  const prize1 = await db.one(
    `INSERT INTO prizes (name, description, points_required, stock, active)
     VALUES ('Vale Presente R$100', 'Vale-presente no valor de R$100', 100, 50, true)
     RETURNING id, name, points_required`,
  );

  const prize2 = await db.one(
    `INSERT INTO prizes (name, description, points_required, stock, active)
     VALUES ('Vale Presente R$500', 'Vale-presente no valor de R$500', 500, 50, true)
     RETURNING id, name, points_required`,
  );

  const prize3 = await db.one(
    `INSERT INTO prizes (name, description, points_required, stock, active)
     VALUES ('Premio Inactivo', 'Este premio no está disponible', 200, 10, false)
     RETURNING id, name, points_required`,
  );

  console.log(`  ✅ Prize 1: ${prize1.name} (${prize1.points_required} pts) id=${prize1.id}`);
  console.log(`  ✅ Prize 2: ${prize2.name} (${prize2.points_required} pts) id=${prize2.id}`);
  console.log(`  ✅ Prize 3: ${prize3.name} (inactive) id=${prize3.id}`);
  return { prize1, prize2, prize3 };
}

// ── Phase 6: Seed Campaign ────────────────────────────────────────────────
async function seedCampaign() {
  console.log('\n📣 Seeding active campaign...');

  const today = new Date();
  const start = today.toISOString().split('T')[0];
  const end   = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()).toISOString().split('T')[0];

  const campaign = await db.one(
    `INSERT INTO campaigns (title, subtitle, focus, points_multiplier, start_date, end_date, active)
     VALUES ('Campaña Test x2', 'Duplica tus puntos este mes', 'all', 2.0, $1, $2, true)
     RETURNING id, title, points_multiplier`,
    [start, end],
  );

  console.log(`  ✅ Campaign: "${campaign.title}" ×${campaign.points_multiplier} id=${campaign.id}`);
  return campaign;
}

// ── Phase 7: Seed Terms ───────────────────────────────────────────────────
async function seedTerms() {
  console.log('\n📜 Seeding terms of service...');

  const terms = await db.one(
    `INSERT INTO terms (content, version, active)
     VALUES ($1, '1.0-test', true)
     RETURNING id, version`,
    [`
# Términos y Condiciones de Uso - SpecPoints (Test)

## 1. Aceptación
Al utilizar la plataforma SpecPoints, acepta estos términos.

## 2. Uso del servicio
La plataforma es para uso profesional de arquitectos y tiendas asociadas.

## 3. Puntos
Los puntos acumulados no tienen valor monetario y no son transferibles.

## 4. Privacidad
Los datos personales son tratados conforme a nuestra política de privacidad.

## 5. Modificaciones
Nos reservamos el derecho de modificar estos términos con previo aviso.
    `.trim()],
  );

  console.log(`  ✅ Terms v${terms.version} id=${terms.id}`);
  return terms;
}

// ── Phase 8: Seed Dashboard Config ────────────────────────────────────────
async function seedDashboardConfigs() {
  console.log('\n📊 Seeding dashboard configs...');

  await db.none(
    `INSERT INTO dashboard_configs (role, message)
     VALUES ('architect', 'Bienvenido al panel de arquitecto.')
     ON CONFLICT (role) DO UPDATE SET message = EXCLUDED.message`,
  );

  await db.none(
    `INSERT INTO dashboard_configs (role, message)
     VALUES ('lojista', 'Bienvenido al panel de la tienda.')
     ON CONFLICT (role) DO UPDATE SET message = EXCLUDED.message`,
  );

  console.log('  ✅ Dashboard configs seeded.');
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   SpecPoints — DB Reset + Seed           ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  API target: ${process.env.DATABASE_URL?.split('@')[1] ?? '(check DATABASE_URL)'}`);

  try {
    await truncateAll();
    await seedAdmin();
    const { architect } = await seedArchitect();
    const { store }     = await seedLojista();
    const prizes        = await seedPrizes();
    const campaign      = await seedCampaign();
    await seedTerms();
    await seedDashboardConfigs();

    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║   ✅  Reset & Seed complete!              ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log('║  CREDENTIALS                              ║');
    console.log('║  Admin:      admin@specpoints.com         ║');
    console.log('║              admin@123456                 ║');
    console.log('║  Arquiteto:  arquiteto@specpoints.com     ║');
    console.log('║              arquiteto@123456             ║');
    console.log('║  Lojista:    lojista@specpoints.com       ║');
    console.log('║              lojista@123456               ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  architect_id : ${architect.id}                          `.slice(0, 44) + '║');
    console.log(`║  store_id     : ${store.id}                          `.slice(0, 44) + '║');
    console.log(`║  prize_ids    : ${prizes.prize1.id}, ${prizes.prize2.id} (active), ${prizes.prize3.id} (inactive)`.slice(0, 44) + '║');
    console.log(`║  campaign_id  : ${campaign.id}                          `.slice(0, 44) + '║');
    console.log('╚══════════════════════════════════════════╝\n');
  } catch (err: any) {
    console.error('\n❌  Reset failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

main().then(() => process.exit(0));
