import { requireAdmin } from '@/lib/server/auth';
import { requestMetadata } from '@/lib/server/analytics';
import { ServiceError } from '@/lib/server/config';
import { cookieValue, failure, requestKey } from '@/lib/server/security';
import { addEvent, consumeRateLimit, getCV, getCVMetadata, type StoredCVMetadata } from '@/lib/server/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function downloadHeaders(cv: StoredCVMetadata) {
  return {
    'Content-Type': 'application/pdf',
    'Content-Length': String(cv.size),
    'Content-Disposition': `attachment; filename="${cv.filename}"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
  };
}

function downloadSource(request: Request): string {
  const source = new URL(request.url).searchParams.get('source') || 'footer';
  if (!['floating', 'footer', 'admin'].includes(source)) throw new ServiceError(400, 'Origem do download inválida.');
  return source;
}

export async function HEAD(request: Request) {
  try {
    if (downloadSource(request) === 'admin') await requireAdmin(request);
    const cv = await getCVMetadata();
    if (!cv) throw new ServiceError(404, 'O currículo ainda não foi disponibilizado.');
    return new Response(null, { headers: downloadHeaders(cv) });
  } catch (error) { return failure(error); }
}

export async function GET(request: Request) {
  try {
    const source = downloadSource(request);
    if (source === 'admin') await requireAdmin(request);
    let countDownload = source !== 'admin';
    if (source !== 'admin') {
      try {
        if (!await consumeRateLimit(`download:${requestKey(request)}`, 30, 60_000)) throw new ServiceError(429, 'Muitos downloads em sequência. Aguarde um minuto e tente novamente.');
      } catch (error) {
        if (error instanceof ServiceError && error.status === 429) throw error;
        countDownload = false;
        console.error('[portfolio-api] Download metrics temporarily unavailable.');
      }
    }
    const cv = await getCV();
    if (!cv) throw new ServiceError(404, 'O currículo ainda não foi disponibilizado.');
    const automated = /bot|crawler|spider|slurp|headless/i.test(request.headers.get('user-agent') || '') || /prefetch/i.test(`${request.headers.get('purpose') || ''} ${request.headers.get('sec-purpose') || ''}`);
    if (countDownload && !automated) {
      const consent = cookieValue(request, 'portfolio_analytics') === 'granted' && request.headers.get('dnt') !== '1';
      // Delivery totals are operational counts. Optional audience metadata is
      // collected only after consent; no visitor/IP identifier is saved here.
      try {
        await addEvent({
          type: 'download', target: `cv:${source}`, path: '/', referrer: '',
          ...(consent ? requestMetadata(request) : { country: '', city: '', device: 'Desconhecido' as const }),
        });
      } catch { console.error('[portfolio-api] A download was delivered without a metrics record.'); }
    }
    return new Response(new Uint8Array(cv.data), {
      headers: downloadHeaders(cv),
    });
  } catch (error) { return failure(error); }
}
