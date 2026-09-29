import { referrerHost, requestMetadata, trackingSchema } from '@/lib/server/analytics';
import { ServiceError } from '@/lib/server/config';
import { checkOrigin, failure, readJson, requestKey } from '@/lib/server/security';
import { addEvent, consumeRateLimit } from '@/lib/server/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (request.headers.get('dnt') === '1') return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    const parsed = trackingSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new ServiceError(400, 'Evento inválido.');
    if (parsed.data.analyticsConsent !== true) return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    if (!await consumeRateLimit(`track:${requestKey(request)}`, 120, 60_000)) throw new ServiceError(429, 'Limite temporário de eventos atingido.');
    const { type, target, path, visitorId, referrer } = parsed.data;
    await addEvent({ type, target, path, visitorId, referrer: referrerHost(referrer), ...requestMetadata(request) });
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
