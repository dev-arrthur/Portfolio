import { z } from 'zod';
import { issueSession, revokeSession, setSessionCookie, verifyPassword } from '@/lib/server/auth';
import { adminConfigured, ServiceError } from '@/lib/server/config';
import { checkOrigin, failure, json, readJson, requestKey } from '@/lib/server/security';
import { consumeRateLimit } from '@/lib/server/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (!adminConfigured()) throw new ServiceError(503, 'O acesso administrativo ainda não foi configurado.');
    const allowed = await consumeRateLimit(`login:${requestKey(request)}`, 5, 15 * 60_000);
    if (!allowed) throw new ServiceError(429, 'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.');
    const globalAllowed = await consumeRateLimit('login:global', 50, 15 * 60_000);
    if (!globalAllowed) throw new ServiceError(429, 'Muitas tentativas. Aguarde alguns minutos.');
    const parsed = z.object({ password: z.string().min(1).max(256) }).strict().safeParse(await readJson(request));
    if (!parsed.success) throw new ServiceError(400, 'Informe sua senha de acesso.');
    if (!await verifyPassword(parsed.data.password)) throw new ServiceError(401, 'Senha inválida.');
    await revokeSession(request);
    const token = await issueSession();
    const response = json({ ok: true });
    setSessionCookie(response, token);
    return response;
  } catch (error) { return failure(error); }
}
