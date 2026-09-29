import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID, scryptSync } from 'node:crypto';
import { authenticated, decodeSession, encodeSession, issueSession, passwordVersion, revokeSession, verifyPassword } from '../src/lib/server/auth';
import { csvCell, referrerHost, requestMetadata, summarizeEvents } from '../src/lib/server/analytics';
import { MAX_CV_BYTES, SESSION_COOKIE, storageDriver } from '../src/lib/server/config';
import { validateCV } from '../src/lib/server/cv';
import { checkOrigin, requestKey } from '../src/lib/server/security';
import { addEvent, consumeRateLimit, deleteCV, getCV, getCVMetadata, getEvents, saveCV, type AnalyticsEvent } from '../src/lib/server/storage';
import { GET as publicCV } from '../src/app/api/cv/route';
import { GET as downloadCV, HEAD as headCV } from '../src/app/api/cv/download/route';
import { POST as track } from '../src/app/api/track/route';
import { POST as login } from '../src/app/api/admin/login/route';
import { POST as uploadCV, DELETE as removeCV } from '../src/app/api/admin/cv/route';
import { GET as adminStats } from '../src/app/api/admin/stats/route';

const previous = { ...process.env };
const testPassword = 'This-is-only-a-test-password';
const salt = '00112233445566778899aabbccddeeff';
const origin = 'http://localhost:3000';
let directory = '';
let configuredHash = '';
const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<<>>\n%%EOF\n');

before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'portfolio-backend-'));
  process.env.STORAGE_DRIVER = 'local';
  process.env.LOCAL_DATA_DIR = directory;
  Object.assign(process.env, { NODE_ENV: 'test' });
  delete process.env.VERCEL;
  process.env.SESSION_SECRET = 'isolated-test-session-secret-with-48-characters';
  configuredHash = `scrypt:${salt}:${scryptSync(testPassword, salt, 64).toString('hex')}`;
  process.env.ADMIN_PASSWORD_HASH = configuredHash;
});

after(async () => {
  await rm(directory, { recursive: true, force: true });
  for (const key of Object.keys(process.env)) if (!(key in previous)) delete process.env[key];
  Object.assign(process.env, previous);
});

const request = (pathname: string, options: RequestInit = {}) => new Request(`${origin}${pathname}`, options);
const headers = (token?: string) => ({ origin, ...(token ? { cookie: `${SESSION_COOKIE}=${token}` } : {}) });

test('password hashing rejects a wrong password and session signatures reject tamper, expiry and rotation', async () => {
  assert.equal(await verifyPassword(testPassword), true);
  assert.equal(await verifyPassword('wrong'), false);
  const payload = { sid: '1'.repeat(64), version: passwordVersion(), exp: Math.floor(Date.now() / 1000) + 100 };
  const token = encodeSession(payload);
  assert.deepEqual(decodeSession(token), payload);
  assert.equal(decodeSession(`${token}tampered`), null);
  assert.equal(decodeSession(encodeSession({ ...payload, exp: Math.floor(Date.now() / 1000) - 1 })), null);
  process.env.ADMIN_PASSWORD_HASH = `scrypt:${salt}:${'a'.repeat(128)}`;
  assert.equal(decodeSession(token), null);
  process.env.ADMIN_PASSWORD_HASH = configuredHash;
});

test('a signed token needs a persistent session and logout revokes it', async () => {
  const fake = encodeSession({ sid: '2'.repeat(64), version: passwordVersion(), exp: Math.floor(Date.now() / 1000) + 100 });
  assert.equal(await authenticated(request('/api/admin/stats', { headers: headers(fake) })), false);
  const token = await issueSession();
  const authenticatedRequest = request('/api/admin/stats', { headers: headers(token) });
  assert.equal(await authenticated(authenticatedRequest), true);
  await revokeSession(authenticatedRequest);
  assert.equal(await authenticated(authenticatedRequest), false);
});

test('origin checks reject missing and cross-origin writes', () => {
  assert.throws(() => checkOrigin(request('/api/admin/login', { method: 'POST' })), /Origem/);
  assert.throws(() => checkOrigin(request('/api/admin/login', { method: 'POST', headers: { origin: 'https://attacker.example' } })), /Origem/);
  assert.doesNotThrow(() => checkOrigin(request('/api/admin/login', { method: 'POST', headers: headers() })));
});

test('rate limits persist and simultaneous requests cannot bypass the maximum', async () => {
  const key = `test:${randomUUID()}`;
  const results = await Promise.all(Array.from({ length: 8 }, () => consumeRateLimit(key, 3, 60000)));
  assert.equal(results.filter(Boolean).length, 3);
  assert.equal(await consumeRateLimit(key, 3, 60000), false);
  assert.match(requestKey(request('/')), /^[a-f0-9]{64}$/);
});

test('local storage cannot accidentally be used in production or Vercel', () => {
  Object.assign(process.env, { NODE_ENV: 'production' });
  assert.throws(storageDriver, /armazenamento/);
  Object.assign(process.env, { NODE_ENV: 'test', VERCEL: '1' });
  assert.throws(storageDriver, /armazenamento/);
  delete process.env.VERCEL;
});

test('unconfigured production storage leaves the public page usable and never silently uses local data', async () => {
  const mongo = process.env.MONGODB_URI;
  process.env.STORAGE_DRIVER = 'mongodb';
  delete process.env.MONGODB_URI;
  try {
    assert.throws(storageDriver, /armazenamento/);
    const metadata = await publicCV();
    assert.equal(metadata.status, 200);
    assert.deepEqual(await metadata.json(), { available: false });
    const tracking = await track(request('/api/track', {
      method: 'POST', headers: { ...headers(), 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'pageview', target: 'page:home', path: '/', visitorId: randomUUID(), analyticsConsent: true }),
    }));
    assert.equal(tracking.status, 503);
  } finally {
    process.env.STORAGE_DRIVER = 'local';
    if (mongo) process.env.MONGODB_URI = mongo;
  }
});

test('PDF validation enforces format, maximum size and a safe filename; replacement preserves one current CV', async () => {
  assert.throws(() => validateCV(Buffer.from('not pdf'), 'cv.pdf', 'application/pdf'), /PDF válido/);
  assert.throws(() => validateCV(pdf, 'cv.html', 'text/html'), /formato PDF/);
  assert.throws(() => validateCV(Buffer.alloc(MAX_CV_BYTES + 1), 'cv.pdf', 'application/pdf'), /3 MB/);
  const first = validateCV(pdf, '../../Currículo"\r\n.pdf', 'application/pdf');
  assert.doesNotMatch(first.filename, /[\r\n"/]/);
  await saveCV(first);
  const next = validateCV(pdf, 'Arthur-CV.pdf', 'application/pdf');
  await saveCV(next);
  assert.equal((await getCV())?.filename, 'Arthur-CV.pdf');
  const metadata = await getCVMetadata();
  assert.ok(metadata && !('data' in metadata));
  await deleteCV();
  assert.equal(await getCV(), null);
});

test('metrics use actual events, fill zero days and deduplicate consented visitors', () => {
  const now = new Date('2026-09-29T20:00:00Z');
  const base = { id: '1', path: '/', createdAt: now, expiresAt: new Date('2027-01-01'), country: 'BR', city: 'Juiz de Fora', device: 'Desktop' as const, referrer: 'github.com' };
  const events: AnalyticsEvent[] = [
    { ...base, type: 'pageview', target: 'page:home', visitorId: 'visitor-a' },
    { ...base, id: '2', type: 'pageview', target: 'page:home', visitorId: 'visitor-a' },
    { ...base, id: '3', type: 'click', target: 'contact:whatsapp', visitorId: 'visitor-b' },
    { ...base, id: '4', type: 'download', target: 'cv:floating' },
    { ...base, id: '5', type: 'pageview', target: 'page:home', createdAt: new Date('2026-08-01') },
  ];
  const summary = summarizeEvents(events, 7, now);
  assert.deepEqual(summary.totals, { pageviews: 2, visitors: 2, clicks: 1, downloads: 1 });
  assert.equal(summary.daily.length, 7);
  assert.equal(summary.daily[0].pageviews, 0);
  assert.equal(summary.daily[6].downloads, 1);
  assert.deepEqual(summary.topClicks, [{ target: 'contact:whatsapp', count: 1 }]);
  assert.deepEqual(summary.locations, [{ country: 'BR', city: 'Juiz de Fora', count: 2 }]);
  assert.equal(csvCell('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"');
  assert.equal(referrerHost('https://example.com/private?q=secret'), 'example.com');
});

test('geo headers are ignored outside Vercel, and analytics needs consent and respects DNT', async () => {
  assert.equal(requestMetadata(request('/', { headers: { 'x-vercel-ip-city': 'Injected', 'x-vercel-ip-country': 'BR' } })).city, '');
  const payload = { type: 'pageview', target: 'page:home', path: '/', visitorId: randomUUID(), referrer: 'https://example.com/private' };
  const countBefore = (await getEvents(new Date(0))).length;
  const withoutConsent = await track(request('/api/track', { method: 'POST', headers: { ...headers(), 'content-type': 'application/json' }, body: JSON.stringify(payload) }));
  assert.equal(withoutConsent.status, 204);
  const dnt = await track(request('/api/track', { method: 'POST', headers: { ...headers(), dnt: '1', 'content-type': 'application/json' }, body: JSON.stringify({ ...payload, analyticsConsent: true }) }));
  assert.equal(dnt.status, 204);
  assert.equal((await getEvents(new Date(0))).length, countBefore);
  const accepted = await track(request('/api/track', { method: 'POST', headers: { ...headers(), 'content-type': 'application/json' }, body: JSON.stringify({ ...payload, analyticsConsent: true }) }));
  assert.equal(accepted.status, 204);
  const persisted = await getEvents(new Date(0));
  assert.equal(persisted.length, countBefore + 1);
  assert.equal(persisted.at(-1)?.referrer, 'example.com');
  assert.ok(persisted.every(event => !('ip' in event)));
});

test('private routes reject anonymous access; admin upload and preview work without inflating downloads', async () => {
  assert.equal((await adminStats(request('/api/admin/stats'))).status, 401);
  assert.equal((await removeCV(request('/api/admin/cv', { method: 'DELETE', headers: headers() }))).status, 401);
  assert.equal((await downloadCV(request('/api/cv/download?source=admin'))).status, 401);
  const token = await issueSession();
  const form = new FormData();
  form.append('file', new File([pdf], 'Curriculo-Arthur.pdf', { type: 'application/pdf' }));
  const uploaded = await uploadCV(request('/api/admin/cv', { method: 'POST', headers: headers(token), body: form }));
  assert.equal(uploaded.status, 200);
  assert.equal((await (await publicCV()).json()).available, true);
  const countBefore = (await getEvents(new Date(0))).filter(event => event.type === 'download').length;
  assert.equal((await headCV(request('/api/cv/download?source=footer', { method: 'HEAD' }))).status, 200);
  assert.equal((await downloadCV(request('/api/cv/download?source=footer', { headers: { 'user-agent': 'Googlebot' } }))).status, 200);
  assert.equal((await getEvents(new Date(0))).filter(event => event.type === 'download').length, countBefore);
  const preview = await downloadCV(request('/api/cv/download?source=admin', { headers: headers(token) }));
  assert.equal(preview.status, 200);
  assert.equal(Buffer.from(await preview.arrayBuffer()).compare(pdf), 0);
  assert.equal((await getEvents(new Date(0))).filter(event => event.type === 'download').length, countBefore);
  const publicDownload = await downloadCV(request('/api/cv/download?source=floating'));
  assert.equal(publicDownload.status, 200);
  assert.match(publicDownload.headers.get('content-disposition') || '', /^attachment;/);
  assert.equal((await getEvents(new Date(0))).filter(event => event.type === 'download').length, countBefore + 1);
  const stats = await adminStats(request('/api/admin/stats?days=7', { headers: headers(token) }));
  assert.equal(stats.status, 200);
  assert.equal((await stats.json()).cv.filename, 'Curriculo-Arthur.pdf');
  await removeCV(request('/api/admin/cv', { method: 'DELETE', headers: headers(token) }));
  assert.equal((await downloadCV(request('/api/cv/download?source=footer'))).status, 404);
});

test('login applies HTTP-only strict cookies and blocks repeated attempts', async () => {
  const body = JSON.stringify({ password: testPassword });
  const crossOrigin = await login(request('/api/admin/login', { method: 'POST', headers: { origin: 'https://attacker.example', 'content-type': 'application/json' }, body }));
  assert.equal(crossOrigin.status, 403);
  const result = await login(request('/api/admin/login', { method: 'POST', headers: { ...headers(), 'content-type': 'application/json' }, body }));
  assert.equal(result.status, 200);
  assert.match(result.headers.get('set-cookie') || '', /HttpOnly/i);
  assert.match(result.headers.get('set-cookie') || '', /SameSite=strict/i);
  for (let index = 0; index < 4; index++) await login(request('/api/admin/login', { method: 'POST', headers: { ...headers(), 'content-type': 'application/json' }, body: JSON.stringify({ password: 'wrong' }) }));
  const limited = await login(request('/api/admin/login', { method: 'POST', headers: { ...headers(), 'content-type': 'application/json' }, body }));
  assert.equal(limited.status, 429);
});
