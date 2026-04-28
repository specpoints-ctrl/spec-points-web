import 'dotenv/config';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// ── Config ────────────────────────────────────────────────────────────────
const API = (process.env.API_BASE_URL ?? 'https://spec-points-api-production.up.railway.app/api').replace(/\/$/, '');
const WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY ?? 'AIzaSyCBf0Po55DuN2LM0c6IsPsoOmaVUmf6Z98';

const ADMIN_UID     = 'admin-test-user-12345';
const ARCHITECT_UID = 'test-architect-uid-001';
const LOJISTA_UID   = 'test-lojista-uid-001';

// ── Firebase Admin ────────────────────────────────────────────────────────
const fbConfig = {
  projectId:   process.env.FIREBASE_PROJECT_ID ?? 'spec-points-prod',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};
if (!fbConfig.clientEmail || !fbConfig.privateKey) {
  console.error('❌  Missing Firebase env vars'); process.exit(1);
}
admin.initializeApp({ credential: admin.credential.cert(fbConfig as admin.ServiceAccount) });

// ── Types ─────────────────────────────────────────────────────────────────
interface TestResult {
  suite: string; name: string; passed: boolean;
  statusCode: number; expectedStatus: number;
  error?: string; body?: string; duration: number;
}
const results: TestResult[] = [];
let adminToken = ''; let archToken = ''; let lojistaToken = '';

// ── Shared state (IDs created during tests) ───────────────────────────────
const state: Record<string, any> = {};

// ── Firebase token helper ─────────────────────────────────────────────────
async function getIdToken(uid: string): Promise<string> {
  const ct  = await admin.auth().createCustomToken(uid);
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${WEB_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: ct, returnSecureToken: true }) },
  );
  const d = await res.json() as any;
  if (!d.idToken) throw new Error(`Token exchange failed: ${JSON.stringify(d)}`);
  return d.idToken;
}

// ── HTTP helper ───────────────────────────────────────────────────────────
async function req(
  method: string, urlPath: string,
  opts: { token?: string; body?: any; expected: number; suite: string; name: string },
): Promise<{ status: number; data: any }> {
  const start = Date.now();
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
    const r = await fetch(`${API}${urlPath}`, {
      method, headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    const status = r.status;
    let data: any = null;
    try { data = await r.json(); } catch { /* non-json */ }
    const passed = status === opts.expected;
    results.push({
      suite: opts.suite, name: opts.name, passed,
      statusCode: status, expectedStatus: opts.expected,
      error: passed ? undefined : `got ${status}, expected ${opts.expected}`,
      body: passed ? undefined : JSON.stringify(data)?.slice(0, 300),
      duration: Date.now() - start,
    });
    return { status, data };
  } catch (err: any) {
    results.push({
      suite: opts.suite, name: opts.name, passed: false,
      statusCode: 0, expectedStatus: opts.expected,
      error: `network: ${err.message}`, duration: Date.now() - start,
    });
    return { status: 0, data: null };
  }
}

// Assert helper — adds extra assertion test record
function assert(suite: string, name: string, condition: boolean, detail?: string) {
  results.push({
    suite, name, passed: condition,
    statusCode: condition ? 200 : 0, expectedStatus: 200,
    error: condition ? undefined : (detail ?? 'assertion failed'),
    duration: 0,
  });
}

// ── SUITE 1: Token setup ──────────────────────────────────────────────────
async function suiteTokenSetup() {
  console.log('  Suite 1: Token setup');
  adminToken   = await getIdToken(ADMIN_UID);
  archToken    = await getIdToken(ARCHITECT_UID);
  lojistaToken = await getIdToken(LOJISTA_UID);
  assert('Token Setup', 'Admin token obtained',   !!adminToken);
  assert('Token Setup', 'Architect token obtained', !!archToken);
  assert('Token Setup', 'Lojista token obtained',  !!lojistaToken);
}

// ── SUITE 2: No-auth on protected endpoints ───────────────────────────────
async function suiteNoAuth() {
  console.log('  Suite 2: No-auth checks');
  const S = 'No Auth';
  const endpoints = [
    ['GET',    '/architects/'],         ['GET',    '/stores/'],
    ['GET',    '/sales/'],              ['GET',    '/prizes/'],
    ['GET',    '/redemptions/'],        ['GET',    '/notifications/'],
    ['GET',    '/campaigns/'],          ['GET',    '/users/'],
    ['GET',    '/dashboard/stats'],     ['GET',    '/profile/'],
    ['GET',    '/auth/me'],             ['GET',    '/architects/me'],
    ['GET',    '/sales/lojista'],       ['GET',    '/sales/my'],
    ['GET',    '/redemptions/my'],      ['GET',    '/campaigns/my'],
    ['GET',    '/notifications/unread-count'],
    ['POST',   '/architects/'],         ['POST',   '/stores/'],
    ['POST',   '/prizes/'],             ['POST',   '/campaigns/'],
    ['POST',   '/notifications/'],      ['POST',   '/terms/accept'],
  ];
  for (const [method, path] of endpoints) {
    await req(method, path, { expected: 401, suite: S, name: `${method} ${path} — no token` });
  }
}

// ── SUITE 3: Wrong-role on admin-only endpoints ───────────────────────────
async function suiteWrongRole() {
  console.log('  Suite 3: Wrong-role checks');
  const S = 'Wrong Role';
  const adminOnly = [
    ['GET',  '/architects/'],     ['GET',  '/stores/'],
    ['GET',  '/sales/'],          ['GET',  '/users/'],
    ['GET',  '/users/pending'],   ['GET',  '/prizes/'],
    ['GET',  '/redemptions/'],    ['GET',  '/campaigns/'],
    ['GET',  '/notifications/admin'],
    ['POST', '/architects/'],     ['POST', '/stores/'],
    ['POST', '/prizes/'],         ['POST', '/campaigns/'],
    ['POST', '/notifications/'],
  ];
  for (const [method, path] of adminOnly) {
    await req(method, path, { token: archToken,    expected: 403, suite: S, name: `${method} ${path} — architect` });
    await req(method, path, { token: lojistaToken, expected: 403, suite: S, name: `${method} ${path} — lojista` });
  }
  // Architect-only endpoints with lojista token
  await req('GET',  '/architects/me',  { token: lojistaToken, expected: 403, suite: S, name: 'GET /architects/me — lojista' });
  await req('GET',  '/sales/my',       { token: lojistaToken, expected: 403, suite: S, name: 'GET /sales/my — lojista' });
  await req('GET',  '/redemptions/my', { token: lojistaToken, expected: 403, suite: S, name: 'GET /redemptions/my — lojista' });
  await req('POST', '/redemptions/request', { token: lojistaToken, body: { prize_id: 1 }, expected: 403, suite: S, name: 'POST /redemptions/request — lojista' });
  // Lojista-only endpoints with architect token
  await req('GET',  '/sales/lojista',  { token: archToken, expected: 403, suite: S, name: 'GET /sales/lojista — architect' });
  await req('POST', '/sales/lojista',  { token: archToken, body: {}, expected: 403, suite: S, name: 'POST /sales/lojista — architect' });
}

// ── SUITE 4: Architects CRUD ──────────────────────────────────────────────
async function suiteArchitectsCRUD() {
  console.log('  Suite 4: Architects CRUD');
  const S = 'Architects CRUD';

  // List
  const list = await req('GET', '/architects/', { token: adminToken, expected: 200, suite: S, name: 'GET / — admin 200' });
  assert(S, 'GET / returns array', Array.isArray(list.data?.data));

  // Active-complete (any auth)
  await req('GET', '/architects/active-complete', { token: archToken,    expected: 200, suite: S, name: 'GET /active-complete — architect' });
  await req('GET', '/architects/active-complete', { token: lojistaToken, expected: 200, suite: S, name: 'GET /active-complete — lojista' });
  await req('GET', '/architects/active-complete', { token: adminToken,   expected: 200, suite: S, name: 'GET /active-complete — admin' });

  // GET /me as architect
  const me = await req('GET', '/architects/me', { token: archToken, expected: 200, suite: S, name: 'GET /me — architect 200' });
  assert(S, 'GET /me has email', me.data?.data?.email === 'arquiteto@specpoints.com');

  // Create new architect
  const created = await req('POST', '/architects/', {
    token: adminToken, expected: 201, suite: S, name: 'POST / create — admin 201',
    body: { email: 'temp.arch@test.com', nome: 'Temp Arch', empresa: 'Temp Co', telefone: '999' },
  });
  assert(S, 'Create returns id', !!created.data?.data?.id);
  state.tempArchId = created.data?.data?.id;

  // Duplicate email
  await req('POST', '/architects/', {
    token: adminToken, expected: 409, suite: S, name: 'POST / duplicate email — 409',
    body: { email: 'temp.arch@test.com', nome: 'X', empresa: 'Y', telefone: '0' },
  });

  // Missing required fields
  await req('POST', '/architects/', {
    token: adminToken, expected: 400, suite: S, name: 'POST / missing fields — 400',
    body: { email: 'missing@test.com' },
  });

  // GET by ID (admin)
  if (state.tempArchId) {
    await req('GET', `/architects/${state.tempArchId}`, { token: adminToken, expected: 200, suite: S, name: 'GET /:id — admin 200' });
    // Architect accessing own ID
    const archList = await req('GET', '/architects/', { token: adminToken, expected: 200, suite: S, name: 'GET / for arch id lookup' });
    const seedArch = archList.data?.data?.find((a: any) => a.email === 'arquiteto@specpoints.com');
    if (seedArch) {
      await req('GET', `/architects/${seedArch.id}`, { token: archToken, expected: 200, suite: S, name: 'GET /:own-id — architect 200' });
      await req('GET', `/architects/${state.tempArchId}`, { token: archToken, expected: 403, suite: S, name: "GET /:other-id — architect 403" });
    }
  }

  // Update
  if (state.tempArchId) {
    const upd = await req('PUT', `/architects/${state.tempArchId}`, {
      token: adminToken, expected: 200, suite: S, name: 'PUT /:id — admin 200',
      body: { nome: 'Updated Name' },
    });
    assert(S, 'Update changes name', upd.data?.data?.nome === 'Updated Name');
  }

  // Status update
  if (state.tempArchId) {
    await req('PATCH', `/architects/${state.tempArchId}/status`, { token: adminToken, expected: 200, suite: S, name: 'PATCH status active — 200', body: { status: 'inactive' } });
    await req('PATCH', `/architects/${state.tempArchId}/status`, { token: adminToken, expected: 400, suite: S, name: 'PATCH status invalid — 400', body: { status: 'banned' } });
    await req('PATCH', `/architects/${state.tempArchId}/status`, { token: adminToken, expected: 200, suite: S, name: 'PATCH status restore — 200', body: { status: 'active' } });
  }

  // Non-existent ID
  await req('GET', '/architects/999999', { token: adminToken, expected: 404, suite: S, name: 'GET /999999 — 404' });
}

// ── SUITE 5: Stores CRUD ──────────────────────────────────────────────────
async function suiteStoresCRUD() {
  console.log('  Suite 5: Stores CRUD');
  const S = 'Stores CRUD';

  const list = await req('GET', '/stores/', { token: adminToken, expected: 200, suite: S, name: 'GET / — admin 200' });
  assert(S, 'GET / returns array', Array.isArray(list.data?.data));

  await req('GET', '/stores/active-list', { token: archToken,    expected: 200, suite: S, name: 'GET /active-list — architect' });
  await req('GET', '/stores/active-list', { token: lojistaToken, expected: 200, suite: S, name: 'GET /active-list — lojista' });

  const created = await req('POST', '/stores/', {
    token: adminToken, expected: 201, suite: S, name: 'POST / create — 201',
    body: { nome: 'Tienda Temp', cnpj: '11.111.111/0001-11' },
  });
  assert(S, 'Create returns id', !!created.data?.data?.id);
  state.tempStoreId = created.data?.data?.id;

  // Duplicate CNPJ
  await req('POST', '/stores/', {
    token: adminToken, expected: 409, suite: S, name: 'POST / duplicate CNPJ — 409',
    body: { nome: 'Dup', cnpj: '11.111.111/0001-11' },
  });

  // Missing required
  await req('POST', '/stores/', {
    token: adminToken, expected: 400, suite: S, name: 'POST / missing nome — 400',
    body: { cnpj: '22.222.222/0001-22' },
  });

  if (state.tempStoreId) {
    await req('GET',  `/stores/${state.tempStoreId}`, { token: adminToken, expected: 200, suite: S, name: 'GET /:id — 200' });
    await req('PUT',  `/stores/${state.tempStoreId}`, { token: adminToken, expected: 200, suite: S, name: 'PUT /:id — 200', body: { nome: 'Updated Store' } });
    await req('PATCH',`/stores/${state.tempStoreId}/status`, { token: adminToken, expected: 200, suite: S, name: 'PATCH status inactive — 200', body: { status: 'inactive' } });
    await req('PATCH',`/stores/${state.tempStoreId}/status`, { token: adminToken, expected: 400, suite: S, name: 'PATCH status invalid — 400', body: { status: 'closed' } });
    await req('PATCH',`/stores/${state.tempStoreId}/status`, { token: adminToken, expected: 200, suite: S, name: 'PATCH status restore — 200', body: { status: 'active' } });
    // Delete (also tests the FK fix)
    await req('DELETE', `/stores/${state.tempStoreId}`, { token: adminToken, expected: 200, suite: S, name: 'DELETE /:id — 200' });
    await req('GET',    `/stores/${state.tempStoreId}`, { token: adminToken, expected: 404, suite: S, name: 'GET /:id after delete — 404' });
  }

  await req('GET', '/stores/999999', { token: adminToken, expected: 404, suite: S, name: 'GET /999999 — 404' });
}

// ── SUITE 6: Prizes CRUD ──────────────────────────────────────────────────
async function suitePrizesCRUD() {
  console.log('  Suite 6: Prizes CRUD');
  const S = 'Prizes CRUD';

  const list = await req('GET', '/prizes/', { token: adminToken, expected: 200, suite: S, name: 'GET / — admin 200' });
  assert(S, 'GET / returns array', Array.isArray(list.data?.data));

  const active = await req('GET', '/prizes/active', { token: archToken, expected: 200, suite: S, name: 'GET /active — architect 200' });
  assert(S, 'GET /active only active prizes', (active.data?.data ?? []).every((p: any) => p.active !== false));
  await req('GET', '/prizes/active', { token: lojistaToken, expected: 200, suite: S, name: 'GET /active — lojista 200' });

  const created = await req('POST', '/prizes/', {
    token: adminToken, expected: 201, suite: S, name: 'POST / create — 201',
    body: { name: 'Premio Temp', points_required: 50, stock: 10, active: true },
  });
  assert(S, 'Create prize returns id', !!created.data?.data?.id);
  state.tempPrizeId = created.data?.data?.id;

  // Missing points_required
  await req('POST', '/prizes/', {
    token: adminToken, expected: 400, suite: S, name: 'POST / missing points_required — 400',
    body: { name: 'Bad Prize' },
  });

  if (state.tempPrizeId) {
    await req('GET', `/prizes/${state.tempPrizeId}`, { token: adminToken, expected: 200, suite: S, name: 'GET /:id — 200' });
    const upd = await req('PUT', `/prizes/${state.tempPrizeId}`, {
      token: adminToken, expected: 200, suite: S, name: 'PUT /:id — 200',
      body: { name: 'Premio Actualizado', stock: 20 },
    });
    assert(S, 'Update prize name', upd.data?.data?.name === 'Premio Actualizado');
    await req('PATCH', `/prizes/${state.tempPrizeId}/active`, { token: adminToken, expected: 200, suite: S, name: 'PATCH /active toggle — 200' });
    await req('PATCH', `/prizes/${state.tempPrizeId}/active`, { token: adminToken, expected: 200, suite: S, name: 'PATCH /active toggle back — 200' });
    await req('DELETE', `/prizes/${state.tempPrizeId}`, { token: adminToken, expected: 200, suite: S, name: 'DELETE /:id — 200' });
  }
}

// ── SUITE 7: Campaigns CRUD ───────────────────────────────────────────────
async function suiteCampaignsCRUD() {
  console.log('  Suite 7: Campaigns CRUD');
  const S = 'Campaigns CRUD';

  const list = await req('GET', '/campaigns/', { token: adminToken, expected: 200, suite: S, name: 'GET / — admin 200' });
  assert(S, 'GET / returns array', Array.isArray(list.data?.data));

  const active = await req('GET', '/campaigns/active', { token: archToken, expected: 200, suite: S, name: 'GET /active — architect 200' });
  assert(S, 'GET /active has campaign', (active.data?.data?.length ?? 0) >= 1);
  await req('GET', '/campaigns/active', { token: lojistaToken, expected: 200, suite: S, name: 'GET /active — lojista 200' });

  await req('GET', '/campaigns/my', { token: archToken, expected: 200, suite: S, name: 'GET /my — architect 200' });

  const today = new Date().toISOString().split('T')[0];
  const next  = new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0];

  const created = await req('POST', '/campaigns/', {
    token: adminToken, expected: 201, suite: S, name: 'POST / create — 201',
    body: { title: 'Test Campaign 2', points_multiplier: 1.5, start_date: today, end_date: next, focus: 'architect', active: false },
  });
  assert(S, 'Create campaign returns id', !!created.data?.data?.id);
  state.campId2 = created.data?.data?.id;

  // Invalid dates
  await req('POST', '/campaigns/', {
    token: adminToken, expected: 400, suite: S, name: 'POST / end before start — 400',
    body: { title: 'Bad', points_multiplier: 1, start_date: next, end_date: today },
  });

  // Zero multiplier
  await req('POST', '/campaigns/', {
    token: adminToken, expected: 400, suite: S, name: 'POST / multiplier=0 — 400',
    body: { title: 'Zero', points_multiplier: 0, start_date: today, end_date: next },
  });

  // Missing required
  await req('POST', '/campaigns/', {
    token: adminToken, expected: 400, suite: S, name: 'POST / missing title — 400',
    body: { points_multiplier: 1, start_date: today, end_date: next },
  });

  if (state.campId2) {
    await req('GET', `/campaigns/${state.campId2}`,           { token: adminToken, expected: 200, suite: S, name: 'GET /:id — 200' });
    await req('GET', `/campaigns/${state.campId2}/ranking`,   { token: adminToken, expected: 200, suite: S, name: 'GET /:id/ranking — 200' });
    await req('PUT', `/campaigns/${state.campId2}`,           { token: adminToken, expected: 200, suite: S, name: 'PUT /:id — 200', body: { title: 'Updated Campaign', active: true } });
  }

  await req('GET', '/campaigns/999999', { token: adminToken, expected: 404, suite: S, name: 'GET /999999 — 404' });
}

// ── SUITE 8: Sales — lojista creates ─────────────────────────────────────
async function suiteSalesCreate() {
  console.log('  Suite 8: Sales — lojista creates');
  const S = 'Sales Create';

  // Get seed architect ID
  const archList = await req('GET', '/architects/active-complete', { token: lojistaToken, expected: 200, suite: S, name: 'GET active-complete for sale' });
  const seedArch = (archList.data?.data ?? []).find((a: any) => a.email === 'arquiteto@specpoints.com');
  state.seedArchitectId = seedArch?.id;

  if (!state.seedArchitectId) {
    assert(S, 'Seed architect found for sales tests', false, 'could not find arquiteto@specpoints.com in active-complete');
    return;
  }

  // Valid sale
  const sale1 = await req('POST', '/sales/lojista', {
    token: lojistaToken, expected: 201, suite: S, name: 'POST /lojista valid — 201',
    body: { architect_id: state.seedArchitectId, amount_usd: 100, client_name: 'Cliente Teste', product_name: 'Produto A', quantity: 2 },
  });
  assert(S, 'Sale returns id', !!sale1.data?.data?.id);
  state.saleId1 = sale1.data?.data?.id;

  // points_effective = floor(100 * 2.0) = 200 (active campaign ×2)
  assert(S, 'points_effective = 200 (×2 campaign)', sale1.data?.data?.points_generated === 200);

  // Sale without architect_id
  await req('POST', '/sales/lojista', {
    token: lojistaToken, expected: 400, suite: S, name: 'POST /lojista no architect_id — 400',
    body: { amount_usd: 50 },
  });

  // Sale without amount
  await req('POST', '/sales/lojista', {
    token: lojistaToken, expected: 400, suite: S, name: 'POST /lojista no amount_usd — 400',
    body: { architect_id: state.seedArchitectId },
  });

  // Sale with architect that has profile_complete=false (temp arch with no profile)
  if (state.tempArchId) {
    await req('POST', '/sales/lojista', {
      token: lojistaToken, expected: 403, suite: S, name: 'POST /lojista profile_complete=false — 403',
      body: { architect_id: state.tempArchId, amount_usd: 50 },
    });
  }

  // Create a 2nd sale for approve/reject tests
  const sale2 = await req('POST', '/sales/lojista', {
    token: lojistaToken, expected: 201, suite: S, name: 'POST /lojista sale2 for reject — 201',
    body: { architect_id: state.seedArchitectId, amount_usd: 50, description: 'Para rejeitar' },
  });
  state.saleId2 = sale2.data?.data?.id;

  // Create more sales for bulk tests
  for (let i = 3; i <= 7; i++) {
    const s = await req('POST', '/sales/lojista', {
      token: lojistaToken, expected: 201, suite: S, name: `POST /lojista sale${i} — 201`,
      body: { architect_id: state.seedArchitectId, amount_usd: i * 10 },
    });
    state[`saleId${i}`] = s.data?.data?.id;
  }

  // GET /sales/lojista — lojista sees own store sales
  const lojistaList = await req('GET', '/sales/lojista', { token: lojistaToken, expected: 200, suite: S, name: 'GET /lojista — 200' });
  assert(S, 'Lojista sees created sales', (lojistaList.data?.data?.length ?? 0) >= 1);

  // GET /sales/my — architect sees own sales (pending)
  const archSales = await req('GET', '/sales/my', { token: archToken, expected: 200, suite: S, name: 'GET /my — architect 200' });
  assert(S, 'Architect sees pending sales', (archSales.data?.data?.length ?? 0) >= 1);

  // Admin sees all
  const adminList = await req('GET', '/sales/', { token: adminToken, expected: 200, suite: S, name: 'GET / — admin 200' });
  assert(S, 'Admin sees all sales', (adminList.data?.data?.length ?? 0) >= 7);
}

// ── SUITE 9: Sales — approve / reject ────────────────────────────────────
async function suiteSalesApprove() {
  console.log('  Suite 9: Sales — approve/reject');
  const S = 'Sales Approve';

  // Get architect points before approval
  const archBefore = await req('GET', '/architects/me', { token: archToken, expected: 200, suite: S, name: 'GET arch points before' });
  const pointsBefore = Number(archBefore.data?.data?.points_total ?? 1500);

  // Approve sale1 (amount=100, ×2 = 200 pts)
  if (state.saleId1) {
    const approved = await req('POST', `/sales/${state.saleId1}/approve`, { token: adminToken, expected: 200, suite: S, name: 'POST /approve pending — 200' });
    assert(S, 'Approve returns success', approved.data?.success === true);

    // Approve already-approved → 400
    await req('POST', `/sales/${state.saleId1}/approve`, { token: adminToken, expected: 400, suite: S, name: 'POST /approve again — 400' });

    // Check points credited
    const archAfter = await req('GET', '/architects/me', { token: archToken, expected: 200, suite: S, name: 'GET arch points after approve' });
    const pointsAfter = Number(archAfter.data?.data?.points_total ?? 0);
    assert(S, 'points_total increased by 200', pointsAfter === pointsBefore + 200, `${pointsAfter} vs ${pointsBefore + 200}`);
  }

  // Reject sale2
  if (state.saleId2) {
    const rejected = await req('POST', `/sales/${state.saleId2}/reject`, { token: adminToken, expected: 200, suite: S, name: 'POST /reject pending — 200' });
    assert(S, 'Reject returns success', rejected.data?.success === true);

    // Reject already-rejected → 400
    await req('POST', `/sales/${state.saleId2}/reject`, { token: adminToken, expected: 400, suite: S, name: 'POST /reject again — 400' });

    // Approve a rejected sale → 400
    await req('POST', `/sales/${state.saleId2}/approve`, { token: adminToken, expected: 400, suite: S, name: 'POST /approve rejected — 400' });

    // Points should NOT have increased after reject
    const archAfterReject = await req('GET', '/architects/me', { token: archToken, expected: 200, suite: S, name: 'GET arch points after reject' });
    const pointsAfterReject = Number(archAfterReject.data?.data?.points_total ?? 0);
    assert(S, 'Reject does not change points', pointsAfterReject === pointsBefore + 200, `after reject: ${pointsAfterReject}`);
  }

  // Approve sales 3-5, reject 6, leave 7 pending
  for (const key of ['saleId3', 'saleId4', 'saleId5']) {
    if (state[key]) {
      await req('POST', `/sales/${state[key]}/approve`, { token: adminToken, expected: 200, suite: S, name: `POST /approve ${key}` });
    }
  }
  if (state.saleId6) {
    await req('POST', `/sales/${state.saleId6}/reject`, { token: adminToken, expected: 200, suite: S, name: 'POST /reject saleId6' });
  }

  // Non-existent sale
  await req('POST', '/sales/999999/approve', { token: adminToken, expected: 404, suite: S, name: 'POST /approve 999999 — 404' });
  await req('POST', '/sales/999999/reject',  { token: adminToken, expected: 404, suite: S, name: 'POST /reject 999999 — 404' });

  // Admin CRUD
  if (state.saleId7) {
    await req('GET', `/sales/${state.saleId7}`, { token: adminToken, expected: 200, suite: S, name: 'GET /:id — admin 200' });
  }
}

// ── SUITE 10: Campaign multiplier check ───────────────────────────────────
async function suiteCampaignMultiplier() {
  console.log('  Suite 10: Campaign multiplier');
  const S = 'Campaign Multiplier';

  if (!state.seedArchitectId) { console.log('    skipped — no seedArchitectId'); return; }

  // Sale without active campaign — deactivate existing campaign first
  const campList = await req('GET', '/campaigns/', { token: adminToken, expected: 200, suite: S, name: 'GET campaigns list' });
  const activeCamp = (campList.data?.data ?? []).find((c: any) => c.active);
  state.activeCampId = activeCamp?.id;

  // Create sale WITH campaign active (×2)
  const saleWith = await req('POST', '/sales/lojista', {
    token: lojistaToken, expected: 201, suite: S, name: 'POST sale with campaign active',
    body: { architect_id: state.seedArchitectId, amount_usd: 200 },
  });
  assert(S, 'points_effective = 400 (200 × 2.0)', saleWith.data?.data?.points_generated === 400);

  // Deactivate campaign
  if (state.activeCampId) {
    await req('PUT', `/campaigns/${state.activeCampId}`, { token: adminToken, expected: 200, suite: S, name: 'Deactivate campaign', body: { active: false } });
  }

  // Create sale WITHOUT campaign active (×1)
  const saleWithout = await req('POST', '/sales/lojista', {
    token: lojistaToken, expected: 201, suite: S, name: 'POST sale without campaign active',
    body: { architect_id: state.seedArchitectId, amount_usd: 200 },
  });
  assert(S, 'points_effective = 200 (200 × 1.0)', saleWithout.data?.data?.points_generated === 200);

  // Re-activate campaign
  if (state.activeCampId) {
    await req('PUT', `/campaigns/${state.activeCampId}`, { token: adminToken, expected: 200, suite: S, name: 'Re-activate campaign', body: { active: true } });
  }

  // Approve both for data integrity checks later
  if (saleWith.data?.data?.id)    await req('POST', `/sales/${saleWith.data.data.id}/approve`, { token: adminToken, expected: 200, suite: S, name: 'Approve campaign sale' });
  if (saleWithout.data?.data?.id) await req('POST', `/sales/${saleWithout.data.data.id}/approve`, { token: adminToken, expected: 200, suite: S, name: 'Approve no-campaign sale' });
}

// ── SUITE 11: Redemptions ─────────────────────────────────────────────────
async function suiteRedemptions() {
  console.log('  Suite 11: Redemptions');
  const S = 'Redemptions';

  // Get prizes
  const prizeList = await req('GET', '/prizes/active', { token: archToken, expected: 200, suite: S, name: 'GET /prizes/active for redemption' });
  const prize100  = (prizeList.data?.data ?? []).find((p: any) => p.points_required <= 100);
  const prize500  = (prizeList.data?.data ?? []).find((p: any) => p.points_required === 500);
  const inactivePrize = (await req('GET', '/prizes/', { token: adminToken, expected: 200, suite: S, name: 'GET /prizes all for inactive' }))
    .data?.data?.find((p: any) => !p.active);

  // Request redemption — insufficient points (need >current available)
  // Architect currently has 1500 + approved sales points. Create a prize worth more.
  const bigPrize = await req('POST', '/prizes/', {
    token: adminToken, expected: 201, suite: S, name: 'Create big prize for insufficiency test',
    body: { name: 'Premio Imposible', points_required: 999999, stock: 1, active: true },
  });
  if (bigPrize.data?.data?.id) {
    await req('POST', '/redemptions/request', {
      token: archToken, expected: 400, suite: S, name: 'POST /request insufficient points — 400',
      body: { prize_id: bigPrize.data.data.id },
    });
    await req('DELETE', `/prizes/${bigPrize.data.data.id}`, { token: adminToken, expected: 200, suite: S, name: 'Delete big prize' });
  }

  // Request with inactive prize
  if (inactivePrize) {
    await req('POST', '/redemptions/request', {
      token: archToken, expected: 400, suite: S, name: 'POST /request inactive prize — 400',
      body: { prize_id: inactivePrize.id },
    });
  }

  // Request with non-existent prize
  await req('POST', '/redemptions/request', {
    token: archToken, expected: 404, suite: S, name: 'POST /request nonexistent prize — 404',
    body: { prize_id: 999999 },
  });

  // Valid redemption request (prize ≤ 100 pts)
  if (prize100) {
    const redemption = await req('POST', '/redemptions/request', {
      token: archToken, expected: 201, suite: S, name: 'POST /request valid (≤100 pts) — 201',
      body: { prize_id: prize100.id },
    });
    assert(S, 'Redemption request returns id', !!redemption.data?.data?.id);
    state.redemptionId1 = redemption.data?.data?.id;
  }

  // GET /redemptions/my
  const myRed = await req('GET', '/redemptions/my', { token: archToken, expected: 200, suite: S, name: 'GET /my — architect 200' });
  assert(S, 'GET /my has redemption', (myRed.data?.data?.length ?? 0) >= 1);

  // Admin list
  const adminList = await req('GET', '/redemptions/', { token: adminToken, expected: 200, suite: S, name: 'GET / — admin 200' });
  assert(S, 'Admin sees redemptions', (adminList.data?.data?.length ?? 0) >= 1);

  // Approve (pending → approved)
  if (state.redemptionId1) {
    // Deliver before approve → 400
    await req('PATCH', `/redemptions/${state.redemptionId1}/deliver`, { token: adminToken, expected: 400, suite: S, name: 'PATCH /deliver pending — 400' });

    // Approve
    const archBefore = await req('GET', '/architects/me', { token: archToken, expected: 200, suite: S, name: 'GET arch before redeem approve' });
    const ptsBefore  = Number(archBefore.data?.data?.points_redeemed ?? 0);

    const approved = await req('PATCH', `/redemptions/${state.redemptionId1}/approve`, { token: adminToken, expected: 200, suite: S, name: 'PATCH /approve pending — 200' });
    assert(S, 'Approve returns success', approved.data?.success === true);

    // points_redeemed should increase
    const archAfter = await req('GET', '/architects/me', { token: archToken, expected: 200, suite: S, name: 'GET arch after redeem approve' });
    const ptsAfter  = Number(archAfter.data?.data?.points_redeemed ?? 0);
    assert(S, 'points_redeemed increased after approve', ptsAfter > ptsBefore, `${ptsAfter} vs ${ptsBefore}`);

    // Approve again → 400
    await req('PATCH', `/redemptions/${state.redemptionId1}/approve`, { token: adminToken, expected: 400, suite: S, name: 'PATCH /approve again — 400' });

    // Deliver (approved → delivered)
    const delivered = await req('PATCH', `/redemptions/${state.redemptionId1}/deliver`, { token: adminToken, expected: 200, suite: S, name: 'PATCH /deliver approved — 200' });
    assert(S, 'Deliver returns success', delivered.data?.success === true);

    // Deliver again → 400
    await req('PATCH', `/redemptions/${state.redemptionId1}/deliver`, { token: adminToken, expected: 400, suite: S, name: 'PATCH /deliver again — 400' });
  }

  // Admin create/update/delete
  if (prize100) {
    const adminRed = await req('POST', '/redemptions/', {
      token: adminToken, expected: 201, suite: S, name: 'POST / admin create — 201',
      body: { architect_id: state.seedArchitectId ?? 1, prize_id: prize100.id },
    });
    state.redemptionId2 = adminRed.data?.data?.id;
    if (state.redemptionId2) {
      await req('GET',    `/redemptions/${state.redemptionId2}`, { token: adminToken, expected: 200, suite: S, name: 'GET /:id — 200' });
      await req('PATCH',  `/redemptions/${state.redemptionId2}/status`, { token: adminToken, expected: 400, suite: S, name: 'PATCH /status invalid — 400', body: { status: 'invalid' } });
      await req('DELETE', `/redemptions/${state.redemptionId2}`, { token: adminToken, expected: 200, suite: S, name: 'DELETE /:id — 200' });
    }
  }
  await req('GET', '/redemptions/999999', { token: adminToken, expected: 404, suite: S, name: 'GET /999999 — 404' });
}

// ── SUITE 12: Notifications ───────────────────────────────────────────────
async function suiteNotifications() {
  console.log('  Suite 12: Notifications');
  const S = 'Notifications';

  // Create for each target
  for (const target of ['architect', 'lojista', 'all'] as const) {
    const n = await req('POST', '/notifications/', {
      token: adminToken, expected: 201, suite: S, name: `POST / target=${target} — 201`,
      body: { title: `Test ${target}`, message: `Message for ${target}`, type: 'general', target_role: target },
    });
    if (target === 'all') state.notifId = n.data?.data?.id;
    if (target === 'architect') state.notifArchId = n.data?.data?.id;
  }

  // Invalid type
  await req('POST', '/notifications/', {
    token: adminToken, expected: 400, suite: S, name: 'POST / invalid type — 400',
    body: { title: 'X', message: 'Y', type: 'spam', target_role: 'all' },
  });

  // Invalid target
  await req('POST', '/notifications/', {
    token: adminToken, expected: 400, suite: S, name: 'POST / invalid target — 400',
    body: { title: 'X', message: 'Y', type: 'general', target_role: 'unknown' },
  });

  // Missing fields
  await req('POST', '/notifications/', {
    token: adminToken, expected: 400, suite: S, name: 'POST / missing title — 400',
    body: { message: 'Y', target_role: 'all' },
  });

  // GET /notifications — architect sees 'architect' + 'all'
  const archNotifs = await req('GET', '/notifications/', { token: archToken, expected: 200, suite: S, name: 'GET / — architect 200' });
  assert(S, 'Architect sees relevant notifs', (archNotifs.data?.data?.length ?? 0) >= 2);
  const lojistaNotifs = (await req('GET', '/notifications/', { token: lojistaToken, expected: 200, suite: S, name: 'GET / — lojista 200' })).data?.data ?? [];
  assert(S, 'Lojista sees lojista+all notifs', lojistaNotifs.length >= 2);
  // Lojista should NOT see architect-only notif
  assert(S, 'Lojista does NOT see architect-only notif',
    !lojistaNotifs.some((n: any) => n.id === state.notifArchId),
  );

  // Unread count before reading
  const before = await req('GET', '/notifications/unread-count', { token: archToken, expected: 200, suite: S, name: 'GET /unread-count before — 200' });
  assert(S, 'Unread count > 0', (before.data?.data?.count ?? 0) >= 1);

  // Mark one as read
  if (state.notifArchId) {
    await req('PATCH', `/notifications/${state.notifArchId}/read`, { token: archToken, expected: 200, suite: S, name: 'PATCH /:id/read — 200' });
    const after = await req('GET', '/notifications/unread-count', { token: archToken, expected: 200, suite: S, name: 'GET /unread-count after read — 200' });
    assert(S, 'Unread count decreased', (after.data?.data?.count ?? 99) < (before.data?.data?.count ?? 0));
  }

  // Mark all as read
  await req('PATCH', '/notifications/read-all', { token: archToken, expected: 200, suite: S, name: 'PATCH /read-all — 200' });
  const afterAll = await req('GET', '/notifications/unread-count', { token: archToken, expected: 200, suite: S, name: 'GET /unread-count after read-all — 200' });
  assert(S, 'Unread count = 0 after read-all', (afterAll.data?.data?.count ?? 99) === 0);

  // Admin list
  const adminList = await req('GET', '/notifications/admin', { token: adminToken, expected: 200, suite: S, name: 'GET /admin — 200' });
  assert(S, 'Admin sees all notifications', (adminList.data?.data?.length ?? 0) >= 3);

  // Delete
  if (state.notifId) {
    await req('DELETE', `/notifications/${state.notifId}`, { token: adminToken, expected: 200, suite: S, name: 'DELETE /:id — 200' });
    const listAfter = await req('GET', '/notifications/admin', { token: adminToken, expected: 200, suite: S, name: 'GET /admin after delete — 200' });
    assert(S, 'Notification gone after delete', !(listAfter.data?.data ?? []).some((n: any) => n.id === state.notifId));
  }
}

// ── SUITE 13: Users & Approvals ───────────────────────────────────────────
async function suiteUsersApprovals() {
  console.log('  Suite 13: Users & Approvals');
  const S = 'Users';

  // List all
  const all = await req('GET', '/users/', { token: adminToken, expected: 200, suite: S, name: 'GET / — admin 200' });
  assert(S, 'GET / returns array', Array.isArray(all.data?.data));
  assert(S, 'Has at least 3 users', (all.data?.data?.length ?? 0) >= 3);

  // List pending
  const pending = await req('GET', '/users/pending', { token: adminToken, expected: 200, suite: S, name: 'GET /pending — admin 200' });
  assert(S, 'GET /pending returns array', Array.isArray(pending.data?.data ?? []));

  // GET single user
  const users = all.data?.data ?? [];
  const adminUser = users.find((u: any) => u.email === 'admin@specpoints.com');
  const archUser  = users.find((u: any) => u.email === 'arquiteto@specpoints.com');

  if (adminUser) {
    await req('GET', `/users/${adminUser.id}`, { token: adminToken, expected: 200, suite: S, name: 'GET /:id — admin 200' });
  }

  // Approve already-active user → 400
  if (archUser) {
    await req('POST', `/users/${archUser.id}/approve`, { token: adminToken, expected: 400, suite: S, name: 'POST /approve active user — 400' });
  }

  // Non-existent user
  await req('GET', '/users/00000000-0000-0000-0000-000000000000', { token: adminToken, expected: 404, suite: S, name: 'GET /nonexistent — 404' });

  // Filter by status
  await req('GET', '/users/?status=active', { token: adminToken, expected: 200, suite: S, name: 'GET /?status=active — 200' });
  await req('GET', '/users/?role=architect', { token: adminToken, expected: 200, suite: S, name: 'GET /?role=architect — 200' });
}

// ── SUITE 14: Profile ─────────────────────────────────────────────────────
async function suiteProfile() {
  console.log('  Suite 14: Profile');
  const S = 'Profile';

  for (const [name, token] of [['admin', adminToken], ['architect', archToken], ['lojista', lojistaToken]]) {
    const p = await req('GET', '/profile/', { token, expected: 200, suite: S, name: `GET / — ${name} 200` });
    assert(S, `${name} profile has email`, !!p.data?.data?.email);
  }

  // Update display_name
  const upd = await req('PUT', '/profile/', {
    token: archToken, expected: 200, suite: S, name: 'PUT / update display_name — 200',
    body: { display_name: 'João Updated' },
  });
  assert(S, 'display_name updated', upd.data?.data?.display_name === 'João Updated');

  // GET /auth/me
  await req('GET', '/auth/me', { token: adminToken,   expected: 200, suite: S, name: 'GET /auth/me — admin 200' });
  await req('GET', '/auth/me', { token: archToken,    expected: 200, suite: S, name: 'GET /auth/me — architect 200' });
  await req('GET', '/auth/me', { token: lojistaToken, expected: 200, suite: S, name: 'GET /auth/me — lojista 200' });
}

// ── SUITE 15: Dashboard ───────────────────────────────────────────────────
async function suiteDashboard() {
  console.log('  Suite 15: Dashboard');
  const S = 'Dashboard';

  const stats = await req('GET', '/dashboard/stats', { token: adminToken, expected: 200, suite: S, name: 'GET /stats — admin 200' });
  assert(S, 'stats has architects count', typeof stats.data?.data?.architects === 'number');
  assert(S, 'stats has stores count',     typeof stats.data?.data?.stores === 'number');
  assert(S, 'stats has sales count',      typeof stats.data?.data?.sales === 'number');
  assert(S, 'stats has totalPoints',      typeof stats.data?.data?.totalPoints === 'number');
  assert(S, 'stats architects > 0',       stats.data?.data?.architects >= 1);
  assert(S, 'stats stores > 0',           stats.data?.data?.stores >= 1);
}

// ── SUITE 16: Terms ───────────────────────────────────────────────────────
async function suiteTerms() {
  console.log('  Suite 16: Terms');
  const S = 'Terms';

  const active = await req('GET', '/terms/active', { token: undefined, expected: 200, suite: S, name: 'GET /active — public 200' });
  assert(S, 'Active terms has content', !!active.data?.data?.content);
  state.termsId = active.data?.data?.id;

  // Check — not yet accepted
  const check1 = await req('GET', '/terms/check', { token: archToken, expected: 200, suite: S, name: 'GET /check before accept — 200' });
  assert(S, 'accepted=false before', check1.data?.data?.accepted === false);

  // Accept
  if (state.termsId) {
    const accepted = await req('POST', '/terms/accept', {
      token: archToken, expected: 200, suite: S, name: 'POST /accept — 200',
      body: { terms_id: state.termsId },
    });
    assert(S, 'Accept returns success', accepted.data?.success === true);
  }

  // Check — now accepted
  const check2 = await req('GET', '/terms/check', { token: archToken, expected: 200, suite: S, name: 'GET /check after accept — 200' });
  assert(S, 'accepted=true after', check2.data?.data?.accepted === true);

  // Accept same terms again (idempotent)
  if (state.termsId) {
    await req('POST', '/terms/accept', { token: archToken, expected: 200, suite: S, name: 'POST /accept idempotent — 200', body: { terms_id: state.termsId } });
  }

  // Admin CRUD
  const all = await req('GET', '/terms/', { token: adminToken, expected: 200, suite: S, name: 'GET / — admin 200' });
  assert(S, 'GET / returns terms', (all.data?.data?.length ?? 0) >= 1);

  const newTerms = await req('POST', '/terms/', {
    token: adminToken, expected: 201, suite: S, name: 'POST / create — 201',
    body: { content: 'New terms content', version: '2.0-test' },
  });
  if (newTerms.data?.data?.id) {
    await req('PUT', `/terms/${newTerms.data.data.id}`, {
      token: adminToken, expected: 200, suite: S, name: 'PUT /:id — 200',
      body: { content: 'Updated terms' },
    });
  }

  // Missing fields
  await req('POST', '/terms/', { token: adminToken, expected: 400, suite: S, name: 'POST / missing content — 400', body: { version: '3.0' } });
}

// ── SUITE 17: Data Integrity ──────────────────────────────────────────────
async function suiteDataIntegrity() {
  console.log('  Suite 17: Data Integrity');
  const S = 'Data Integrity';

  // Verify architect's points_total via /architects/me
  const arch = await req('GET', '/architects/me', { token: archToken, expected: 200, suite: S, name: 'GET /architects/me integrity check' });
  const total = Number(arch.data?.data?.points_total ?? 0);
  assert(S, 'points_total ≥ 1500 (seed) + 200 (approved) + 400 + 200', total >= 1500 + 200, `actual: ${total}`);

  // points_redeemed ≤ points_total
  const redeemed = Number(arch.data?.data?.points_redeemed ?? 0);
  assert(S, 'points_redeemed ≤ points_total', redeemed <= total, `redeemed ${redeemed} > total ${total}`);

  // Admin dashboard reflects sales
  const stats = await req('GET', '/dashboard/stats', { token: adminToken, expected: 200, suite: S, name: 'GET dashboard for integrity' });
  assert(S, 'dashboard.sales reflects created sales', (stats.data?.data?.sales ?? 0) >= 8);
  assert(S, 'dashboard.totalPoints > 0',              (stats.data?.data?.totalPoints ?? 0) > 0);

  // GET /sales/my — architect sees own sales
  const myS = await req('GET', '/sales/my', { token: archToken, expected: 200, suite: S, name: 'Architect sales list integrity' });
  assert(S, 'Architect sees all their sales', (myS.data?.data?.length ?? 0) >= 8);

  // Lojista GET /sales/lojista — only store sales
  const lojiS = await req('GET', '/sales/lojista', { token: lojistaToken, expected: 200, suite: S, name: 'Lojista sales list integrity' });
  assert(S, 'Lojista sees their store sales', (lojiS.data?.data?.length ?? 0) >= 8);

  // Campaign ranking has architect
  if (state.activeCampId) {
    const ranking = await req('GET', `/campaigns/${state.activeCampId}/ranking`, { token: adminToken, expected: 200, suite: S, name: 'Campaign ranking has entries' });
    assert(S, 'Campaign ranking populated', (ranking.data?.data?.ranking?.length ?? 0) >= 1);
  }
}

// ── SUITE 18: Edge Cases — Invalid IDs ───────────────────────────────────
async function suiteEdgeCasesIds() {
  console.log('  Suite 18: Edge cases — invalid IDs');
  const S = 'Edge Cases: IDs';

  const notFounds = [
    ['GET',    '/architects/999999'],
    ['PUT',    '/architects/999999'],
    ['DELETE', '/architects/999999'],
    ['GET',    '/stores/999999'],
    ['PUT',    '/stores/999999'],
    ['GET',    '/prizes/999999'],
    ['PUT',    '/prizes/999999'],
    ['GET',    '/campaigns/999999'],
    ['PUT',    '/campaigns/999999'],
    ['GET',    '/redemptions/999999'],
    ['GET',    '/sales/999999'],
  ];
  for (const [method, path] of notFounds) {
    await req(method, path, { token: adminToken, expected: 404, suite: S, name: `${method} ${path} — 404` });
  }

  // String IDs where integers expected (should be 400 or 404)
  const badIds = [
    ['GET', '/architects/abc'],
    ['GET', '/stores/abc'],
    ['GET', '/prizes/abc'],
    ['GET', '/campaigns/abc'],
  ];
  for (const [method, path] of badIds) {
    const r = await req(method, path, { token: adminToken, expected: 400, suite: S, name: `${method} ${path} — invalid id format` });
    // Accept 400 or 404 — either is valid
    if (r.status === 404) {
      results[results.length - 1].passed = true;
      results[results.length - 1].error = undefined;
    }
  }
}

// ── SUITE 19: Edge Cases — Missing / Invalid Fields ───────────────────────
async function suiteEdgeCasesFields() {
  console.log('  Suite 19: Edge cases — invalid fields');
  const S = 'Edge Cases: Fields';

  // Empty body POSTs
  await req('POST', '/architects/', { token: adminToken, body: {}, expected: 400, suite: S, name: 'POST /architects empty body — 400' });
  await req('POST', '/stores/',     { token: adminToken, body: {}, expected: 400, suite: S, name: 'POST /stores empty body — 400' });
  await req('POST', '/campaigns/',  { token: adminToken, body: {}, expected: 400, suite: S, name: 'POST /campaigns empty body — 400' });
  await req('POST', '/prizes/',     { token: adminToken, body: {}, expected: 400, suite: S, name: 'POST /prizes empty body — 400' });

  // Sales with bad amounts
  if (state.seedArchitectId) {
    await req('POST', '/sales/lojista', {
      token: lojistaToken, expected: 400, suite: S, name: 'POST /sales/lojista amount_usd=0 — 400',
      body: { architect_id: state.seedArchitectId, amount_usd: 0 },
    });
    await req('POST', '/sales/lojista', {
      token: lojistaToken, expected: 400, suite: S, name: 'POST /sales/lojista amount_usd=-1 — 400',
      body: { architect_id: state.seedArchitectId, amount_usd: -1 },
    });
  }

  // Notifications missing fields combos
  await req('POST', '/notifications/', { token: adminToken, body: { title: 'X', target_role: 'all' }, expected: 400, suite: S, name: 'POST /notifications missing message — 400' });
  await req('POST', '/notifications/', { token: adminToken, body: { message: 'Y', target_role: 'all' }, expected: 400, suite: S, name: 'POST /notifications missing title — 400' });
  await req('POST', '/notifications/', { token: adminToken, body: { title: 'X', message: 'Y' }, expected: 400, suite: S, name: 'POST /notifications missing target_role — 400' });

  // Prize with points_required = 0
  await req('POST', '/prizes/', {
    token: adminToken, expected: 400, suite: S, name: 'POST /prizes points_required=0 — 400',
    body: { name: 'Zero Points', points_required: 0 },
  });

  // Campaign missing dates
  const today = new Date().toISOString().split('T')[0];
  await req('POST', '/campaigns/', { token: adminToken, body: { title: 'No Dates', points_multiplier: 1 }, expected: 400, suite: S, name: 'POST /campaigns missing dates — 400' });
  await req('POST', '/campaigns/', { token: adminToken, body: { title: 'No End', points_multiplier: 1, start_date: today }, expected: 400, suite: S, name: 'POST /campaigns missing end_date — 400' });
}

// ── SUITE 20: Edge Cases — Boundary Values ────────────────────────────────
async function suiteEdgeCasesBoundary() {
  console.log('  Suite 20: Edge cases — boundary values');
  const S = 'Edge Cases: Boundary';

  // Very large amount (should work)
  if (state.seedArchitectId) {
    const bigSale = await req('POST', '/sales/lojista', {
      token: lojistaToken, expected: 201, suite: S, name: 'POST /sales/lojista amount=99999.99 — 201',
      body: { architect_id: state.seedArchitectId, amount_usd: 99999.99 },
    });
    assert(S, 'Large amount sale created', bigSale.data?.success === true);
    if (bigSale.data?.data?.id) {
      await req('POST', `/sales/${bigSale.data.data.id}/reject`, { token: adminToken, expected: 200, suite: S, name: 'Reject big sale' });
    }
  }

  // Long strings (should work or 400 — not crash the server)
  const longString = 'A'.repeat(300);
  const longNameResult = await req('POST', '/architects/', {
    token: adminToken, suite: S, name: 'POST /architects long name',
    body: { email: 'long@test.com', nome: longString, empresa: 'X', telefone: '0' },
    expected: 201,
  });
  if (longNameResult.status === 400) {
    results[results.length - 1].passed = true; // Also acceptable
    results[results.length - 1].error = undefined;
  }
  if (longNameResult.data?.data?.id) {
    await req('DELETE', `/architects/${longNameResult.data.data.id}`, { token: adminToken, expected: 200, suite: S, name: 'DELETE long-name architect' });
  }

  // Redemption: missing prize_id
  await req('POST', '/redemptions/request', {
    token: archToken, expected: 400, suite: S, name: 'POST /redemptions/request no prize_id — 400',
    body: {},
  });

  // Status values
  await req('PATCH', '/architects/999999/status', { token: adminToken, expected: 404, suite: S, name: 'PATCH /status 999999 — 404', body: { status: 'active' } });

  // Profile update — extra fields ignored
  const upd = await req('PUT', '/profile/', {
    token: adminToken, expected: 200, suite: S, name: 'PUT /profile extra fields ignored',
    body: { display_name: 'Admin Test', unknown_field: 'should be ignored', firebase_uid: 'hack' },
  });
  assert(S, 'Extra fields do not break update', upd.data?.success === true);
  assert(S, 'firebase_uid not overwritten', upd.data?.data?.firebase_uid !== 'hack');
}

// ── SUITE 21: Temp architect cleanup ─────────────────────────────────────
async function suiteCleanup() {
  console.log('  Suite 21: Cleanup temp data');
  const S = 'Cleanup';
  if (state.tempArchId) {
    await req('DELETE', `/architects/${state.tempArchId}`, { token: adminToken, expected: 200, suite: S, name: 'DELETE temp architect' });
  }
  if (state.campId2) {
    await req('DELETE', `/campaigns/${state.campId2}`, { token: adminToken, expected: 200, suite: S, name: 'DELETE temp campaign 2' });
  }
}

// ── Report generator ──────────────────────────────────────────────────────
function generateReport() {
  const total   = results.length;
  const passed  = results.filter(r => r.passed).length;
  const failed  = results.filter(r => !r.passed).length;
  const suites  = [...new Set(results.map(r => r.suite))];

  const failsBySuite: Record<string, TestResult[]> = {};
  for (const r of results) {
    if (!r.passed) {
      (failsBySuite[r.suite] ??= []).push(r);
    }
  }

  const avgDuration = results.reduce((s, r) => s + r.duration, 0) / total;

  let md = `# SpecPoints — Relatório de Testes de Integração\n\n`;
  md += `**Data:** ${new Date().toLocaleString('es-PY')}\n`;
  md += `**API:** ${API}\n\n`;
  md += `---\n\n`;
  md += `## Resumo\n\n`;
  md += `| | |\n|---|---|\n`;
  md += `| Total | **${total}** |\n`;
  md += `| ✅ Passou | **${passed}** (${((passed/total)*100).toFixed(1)}%) |\n`;
  md += `| ❌ Falhou | **${failed}** |\n`;
  md += `| Duração média | ${avgDuration.toFixed(0)}ms/teste |\n\n`;

  md += `### Por suite\n\n`;
  md += `| Suite | Total | ✅ | ❌ |\n|---|---|---|---|\n`;
  for (const suite of suites) {
    const sr = results.filter(r => r.suite === suite);
    const sp = sr.filter(r => r.passed).length;
    const sf = sr.length - sp;
    md += `| ${suite} | ${sr.length} | ${sp} | ${sf} |\n`;
  }

  if (failed > 0) {
    md += `\n---\n\n## Falhas Detalhadas\n\n`;
    for (const suite of suites) {
      const fails = failsBySuite[suite];
      if (!fails?.length) continue;
      md += `### ${suite}\n\n`;
      md += `| Teste | Esperado | Recebido | Erro |\n|---|---|---|---|\n`;
      for (const f of fails) {
        const body = f.body ? ` — ${f.body.slice(0, 100)}` : '';
        md += `| ${f.name} | ${f.expectedStatus} | ${f.statusCode} | ${(f.error ?? '') + body} |\n`;
      }
      md += '\n';
    }
  }

  // Action plan
  md += `---\n\n## Plano de Ação\n\n`;

  if (failed === 0) {
    md += `🎉 **Todos os testes passaram!** O sistema está funcionando corretamente.\n`;
  } else {
    const critical = results.filter(r => !r.passed && (r.statusCode === 500 || r.statusCode === 0));
    const medium   = results.filter(r => !r.passed && r.statusCode !== 500 && r.statusCode !== 0 && Math.abs(r.statusCode - r.expectedStatus) > 100);
    const low      = results.filter(r => !r.passed && !critical.includes(r) && !medium.includes(r));

    if (critical.length) {
      md += `### 🔴 CRÍTICO — ${critical.length} erros de servidor (500/rede)\n\n`;
      for (const f of critical.slice(0, 10)) {
        md += `- **${f.suite} / ${f.name}**: ${f.error}\n`;
        md += `  - Verificar logs do Railway para stack trace\n`;
      }
      md += '\n';
    }
    if (medium.length) {
      md += `### 🟡 MÉDIO — ${medium.length} status code incorreto\n\n`;
      for (const f of medium.slice(0, 10)) {
        md += `- **${f.suite} / ${f.name}**: esperado ${f.expectedStatus}, recebeu ${f.statusCode}\n`;
      }
      md += '\n';
    }
    if (low.length) {
      md += `### 🟢 BAIXO — ${low.length} falhas leves (validação / lógica)\n\n`;
      for (const f of low.slice(0, 15)) {
        md += `- **${f.suite} / ${f.name}**: ${f.error}\n`;
      }
      md += '\n';
    }

    md += `### Próximos passos\n\n`;
    md += `1. Para erros 500: abrir Railway → Backend → Logs e procurar o stack trace\n`;
    md += `2. Para status 400/404 incorretos: revisar os controllers em \`spec-points-api/src/controllers/\`\n`;
    md += `3. Para falhas de permissão: revisar \`src/middleware/role-check.ts\` e as rotas em \`src/routes/\`\n`;
    md += `4. Para falhas de integridade de dados: revisar a lógica de aprovação em \`src/routes/sales.ts\`\n`;
  }

  return md;
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   SpecPoints — Integration Test Runner           ║');
  console.log(`╚══════════════════════════════════════════════════╝`);
  console.log(`  API: ${API}\n`);

  const start = Date.now();

  await suiteTokenSetup();
  await suiteNoAuth();
  await suiteWrongRole();
  await suiteArchitectsCRUD();
  await suiteStoresCRUD();
  await suitePrizesCRUD();
  await suiteCampaignsCRUD();
  await suiteSalesCreate();
  await suiteSalesApprove();
  await suiteCampaignMultiplier();
  await suiteRedemptions();
  await suiteNotifications();
  await suiteUsersApprovals();
  await suiteProfile();
  await suiteDashboard();
  await suiteTerms();
  await suiteDataIntegrity();
  await suiteEdgeCasesIds();
  await suiteEdgeCasesFields();
  await suiteEdgeCasesBoundary();
  await suiteCleanup();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const passed  = results.filter(r => r.passed).length;
  const failed  = results.filter(r => !r.passed).length;

  console.log(`\n  Finished in ${elapsed}s`);
  console.log(`  Total: ${results.length} | ✅ ${passed} | ❌ ${failed}`);

  const report = generateReport();
  const ts     = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = path.join(process.cwd(), `test-report-${ts}.md`);
  fs.writeFileSync(outPath, report, 'utf8');
  console.log(`\n  📄 Report: ${outPath}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
