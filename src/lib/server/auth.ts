import 'server-only';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';
import { adminConfigured, passwordHash, ServiceError, SESSION_COOKIE, SESSION_SECONDS } from './config';
import { cookieValue, digest, equalSafe, sign } from './security';
import { createSession, deleteSession, findSession } from './storage';

const scrypt = promisify(scryptCallback);
type SessionPayload = { sid: string; exp: number; version: string };

export async function verifyPassword(password: string): Promise<boolean> {
  if (!adminConfigured()) throw new ServiceError(503, 'O acesso administrativo ainda não foi configurado.');
  const [, salt, expected] = passwordHash().split(':');
  if (password.length > 256) return false;
  const derived = await scrypt(password, salt, 64) as Buffer;
  return equalSafe(derived.toString('hex'), expected);
}

export function passwordVersion(): string {
  return digest(passwordHash()).slice(0, 32);
}

export function encodeSession(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${data}.${sign(data)}`;
}

export function decodeSession(token: string, now = Date.now()): SessionPayload | null {
  if (!adminConfigured() || token.length > 1024) return null;
  const pieces = token.split('.');
  if (pieces.length !== 2 || !equalSafe(sign(pieces[0]), pieces[1])) return null;
  try {
    const payload = JSON.parse(Buffer.from(pieces[0], 'base64url').toString('utf8')) as SessionPayload;
    if (typeof payload.sid !== 'string' || !/^[a-f0-9]{64}$/.test(payload.sid)) return null;
    if (!Number.isInteger(payload.exp) || payload.exp <= Math.floor(now / 1000)) return null;
    if (payload.exp > Math.floor(now / 1000) + SESSION_SECONDS + 60) return null;
    if (payload.version !== passwordVersion()) return null;
    return payload;
  } catch { return null; }
}

export async function issueSession(): Promise<string> {
  const payload: SessionPayload = {
    sid: randomBytes(32).toString('hex'),
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
    version: passwordVersion(),
  };
  await createSession({ id: digest(payload.sid), version: payload.version, expiresAt: new Date(payload.exp * 1000) });
  return encodeSession(payload);
}

export async function authenticated(request: Request): Promise<boolean> {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return false;
  const payload = decodeSession(token);
  if (!payload) return false;
  const stored = await findSession(digest(payload.sid));
  return !!stored && stored.expiresAt.getTime() > Date.now() && stored.version === passwordVersion();
}

export async function requireAdmin(request: Request): Promise<void> {
  if (!await authenticated(request)) throw new ServiceError(401, 'Entre no painel para continuar.');
}

export async function revokeSession(request: Request): Promise<void> {
  const token = cookieValue(request, SESSION_COOKIE);
  const payload = token ? decodeSession(token) : null;
  if (payload) await deleteSession(digest(payload.sid));
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 });
}
