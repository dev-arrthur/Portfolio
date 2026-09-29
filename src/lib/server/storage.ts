import 'server-only';
import { MongoClient, Binary } from 'mongodb';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { RETENTION_DAYS, storageDriver } from './config';

export type AnalyticsEvent = {
  id: string;
  type: 'pageview' | 'click' | 'download';
  target: string;
  path: string;
  visitorId?: string;
  createdAt: Date;
  expiresAt: Date;
  country: string;
  city: string;
  device: 'Desktop' | 'Mobile' | 'Tablet' | 'Desconhecido';
  referrer: string;
};
export type StoredSession = { id: string; version: string; expiresAt: Date };
export type StoredCV = { filename: string; updatedAt: Date; size: number; data: Buffer };
export type StoredCVMetadata = Omit<StoredCV, 'data'>;
type RateCounter = { id: string; count: number; expiresAt: Date };
type LocalState = { events: AnalyticsEvent[]; sessions: StoredSession[]; rates: RateCounter[]; cv: null | { filename: string; updatedAt: Date; size: number; data: string } };

const globalStorage = globalThis as typeof globalThis & {
  portfolioMongo?: Promise<MongoClient>;
  portfolioIndexes?: Promise<void>;
  portfolioLocalQueue?: Promise<unknown>;
};

async function database() {
  storageDriver();
  if (!globalStorage.portfolioMongo) {
    const client = new MongoClient(process.env.MONGODB_URI!, { maxPoolSize: 5, serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
    globalStorage.portfolioMongo = client.connect().catch(error => { globalStorage.portfolioMongo = undefined; throw error; });
  }
  const client = await globalStorage.portfolioMongo;
  const db = client.db(process.env.MONGODB_DB || 'arthur_portfolio');
  if (!globalStorage.portfolioIndexes) {
    globalStorage.portfolioIndexes = Promise.all([
      db.collection('events').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection('events').createIndex({ createdAt: -1 }),
      db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection('sessions').createIndex({ id: 1 }, { unique: true }),
      db.collection('rates').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ]).then(() => {}).catch(error => { globalStorage.portfolioIndexes = undefined; throw error; });
  }
  await globalStorage.portfolioIndexes;
  return db;
}

function reviveLocal(raw: LocalState): LocalState {
  const now = Date.now();
  return {
    events: raw.events.map(event => ({ ...event, createdAt: new Date(event.createdAt), expiresAt: new Date(event.expiresAt) })).filter(event => event.expiresAt.getTime() > now),
    sessions: raw.sessions.map(session => ({ ...session, expiresAt: new Date(session.expiresAt) })).filter(session => session.expiresAt.getTime() > now),
    rates: raw.rates.map(rate => ({ ...rate, expiresAt: new Date(rate.expiresAt) })).filter(rate => rate.expiresAt.getTime() > now),
    cv: raw.cv ? { ...raw.cv, updatedAt: new Date(raw.cv.updatedAt) } : null,
  };
}

async function local<T>(operation: (state: LocalState) => T | Promise<T>, mutate = false): Promise<T> {
  storageDriver();
  const run = async () => {
    const directory = process.env.LOCAL_DATA_DIR || path.join(process.cwd(), '.data');
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const filename = path.join(directory, 'portfolio.json');
    let state: LocalState = { events: [], sessions: [], rates: [], cv: null };
    try { state = reviveLocal(JSON.parse(await readFile(filename, 'utf8')) as LocalState); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    const result = await operation(state);
    if (mutate) {
      const temporary = `${filename}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(state), { mode: 0o600 });
      await rename(temporary, filename);
    }
    return result;
  };
  const pending = (globalStorage.portfolioLocalQueue || Promise.resolve()).then(run, run);
  globalStorage.portfolioLocalQueue = pending.then(() => {}, () => {});
  return pending;
}

export async function consumeRateLimit(key: string, maximum: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const window = Math.floor(now / windowMs);
  const id = `${key}:${window}`;
  const expiresAt = new Date((window + 1) * windowMs + 60_000);
  if (storageDriver() === 'local') return local(state => {
    const existing = state.rates.find(rate => rate.id === id);
    if (existing) { existing.count += 1; return existing.count <= maximum; }
    state.rates.push({ id, count: 1, expiresAt });
    return true;
  }, true);
  const db = await database();
  const rate = await db.collection<{ _id: string; count: number; expiresAt: Date }>('rates').findOneAndUpdate(
    { _id: id }, { $inc: { count: 1 }, $setOnInsert: { expiresAt } }, { upsert: true, returnDocument: 'after' },
  );
  return !!rate && rate.count <= maximum;
}

export async function createSession(session: StoredSession): Promise<void> {
  if (storageDriver() === 'local') return local(state => { state.sessions.push(session); }, true);
  const db = await database();
  await db.collection('sessions').insertOne({ ...session });
}

export async function findSession(id: string): Promise<StoredSession | null> {
  if (storageDriver() === 'local') return local(state => state.sessions.find(session => session.id === id) || null);
  const db = await database();
  return db.collection<StoredSession>('sessions').findOne({ id, expiresAt: { $gt: new Date() } });
}

export async function deleteSession(id: string): Promise<void> {
  if (storageDriver() === 'local') return local(state => { state.sessions = state.sessions.filter(session => session.id !== id); }, true);
  const db = await database();
  await db.collection('sessions').deleteOne({ id });
}

export async function addEvent(input: Omit<AnalyticsEvent, 'id' | 'createdAt' | 'expiresAt'>): Promise<void> {
  const event: AnalyticsEvent = { ...input, id: randomUUID(), createdAt: new Date(), expiresAt: new Date(Date.now() + RETENTION_DAYS * 86400_000) };
  if (storageDriver() === 'local') return local(state => { state.events.push(event); }, true);
  const db = await database();
  await db.collection('events').insertOne(event);
}

export async function getEvents(since: Date): Promise<AnalyticsEvent[]> {
  if (storageDriver() === 'local') return local(state => state.events.filter(event => event.createdAt >= since));
  const db = await database();
  return db.collection<AnalyticsEvent>('events').find({ createdAt: { $gte: since }, expiresAt: { $gt: new Date() } }, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
}

export async function getCV(): Promise<StoredCV | null> {
  if (storageDriver() === 'local') return local(state => state.cv ? { ...state.cv, data: Buffer.from(state.cv.data, 'base64') } : null);
  const db = await database();
  const cv = await db.collection<{ _id: string; filename: string; updatedAt: Date; size: number; data: Binary }>('documents').findOne({ _id: 'curriculum' });
  return cv ? { filename: cv.filename, updatedAt: cv.updatedAt, size: cv.size, data: Buffer.from(cv.data.buffer) } : null;
}

export async function getCVMetadata(): Promise<StoredCVMetadata | null> {
  if (storageDriver() === 'local') return local(state => state.cv ? { filename: state.cv.filename, updatedAt: state.cv.updatedAt, size: state.cv.size } : null);
  const db = await database();
  return db.collection<StoredCVMetadata & { _id: string }>('documents').findOne({ _id: 'curriculum' }, { projection: { _id: 0, data: 0 } });
}

export async function saveCV(cv: StoredCV): Promise<void> {
  if (storageDriver() === 'local') return local(state => { state.cv = { ...cv, data: cv.data.toString('base64') }; }, true);
  const db = await database();
  await db.collection<{ _id: string; filename: string; updatedAt: Date; size: number; data: Binary }>('documents').replaceOne(
    { _id: 'curriculum' }, { ...cv, data: new Binary(cv.data) }, { upsert: true },
  );
}

export async function deleteCV(): Promise<void> {
  if (storageDriver() === 'local') return local(state => { state.cv = null; }, true);
  const db = await database();
  await db.collection<{ _id: string }>('documents').deleteOne({ _id: 'curriculum' });
}

export async function storageReady(): Promise<boolean> {
  if (storageDriver() === 'local') return local(() => true);
  const db = await database();
  await db.command({ ping: 1 });
  return true;
}
