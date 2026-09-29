import 'server-only';

export const RETENTION_DAYS = 90;
export const SESSION_SECONDS = 8 * 60 * 60;
export const MAX_CV_BYTES = 3 * 1024 * 1024;
export const SESSION_COOKIE = 'arthur_admin_session';

export class ServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

export function passwordHash(): string {
  return process.env.ADMIN_PASSWORD_HASH?.trim() || '';
}

export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET || '';
  if (secret.length < 32) throw new ServiceError(503, 'O acesso administrativo ainda não foi configurado.');
  return secret;
}

export function adminConfigured(): boolean {
  return /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/i.test(passwordHash()) && (process.env.SESSION_SECRET?.length || 0) >= 32;
}

export function storageDriver(): 'mongodb' | 'local' {
  if (process.env.STORAGE_DRIVER === 'local') {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      throw new ServiceError(503, 'O armazenamento persistente ainda não foi configurado.');
    }
    return 'local';
  }
  if (!process.env.MONGODB_URI) throw new ServiceError(503, 'O armazenamento persistente ainda não foi configurado.');
  return 'mongodb';
}

export function configuredStorageName(): string {
  try { return storageDriver(); } catch { return 'unconfigured'; }
}
