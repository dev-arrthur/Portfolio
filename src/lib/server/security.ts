import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ServiceError, sessionSecret } from './config';

export function checkOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  const configured = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  const allowed = new Set<string>([new URL(request.url).origin]);
  if (configured) {
    try { allowed.add(new URL(configured).origin); } catch { /* Invalid optional URL is ignored. */ }
  }
  if (!origin || !allowed.has(origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new ServiceError(403, 'Origem da solicitação não autorizada.');
  }
}

export function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function equalSafe(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function requestKey(request: Request): string {
  // Vercel overwrites the forwarding header. Other deployments share one safe
  // rate bucket until their trusted reverse proxy is explicitly implemented.
  const ip = process.env.VERCEL
    ? (request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim()
    : 'local';
  const secret = process.env.RATE_LIMIT_SECRET || process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new ServiceError(503, 'A coleta de indicadores ainda não foi configurada.');
  return createHmac('sha256', secret).update(ip).digest('hex');
}

export function sign(value: string): string {
  return createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export function failure(error: unknown): NextResponse {
  if (error instanceof ServiceError) return json({ error: error.message }, error.status);
  // Deliberately do not log database URLs, request bodies or credentials.
  console.error('[portfolio-api] A server operation failed.');
  return json({ error: 'Não foi possível concluir a solicitação. Tente novamente.' }, 503);
}

export async function readJson(request: Request, maxBytes = 4096): Promise<unknown> {
  const declared = Number(request.headers.get('content-length') || '0');
  if (declared > maxBytes) throw new ServiceError(413, 'Solicitação muito grande.');
  if (!request.headers.get('content-type')?.includes('application/json')) throw new ServiceError(415, 'Envie os dados em JSON.');
  if (!request.body) throw new ServiceError(400, 'Solicitação inválida.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    size += result.value.length;
    if (size > maxBytes) { await reader.cancel(); throw new ServiceError(413, 'Solicitação muito grande.'); }
    chunks.push(result.value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new ServiceError(400, 'Solicitação inválida.'); }
}

export function cookieValue(request: Request, key: string): string | undefined {
  const cookie = request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(`${key}=`));
  if (!cookie) return undefined;
  try { return decodeURIComponent(cookie.slice(key.length + 1)); } catch { return undefined; }
}
