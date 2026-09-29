import { requireAdmin } from '@/lib/server/auth';
import { eventsCSV, parseDays, periodStart } from '@/lib/server/analytics';
import { failure } from '@/lib/server/security';
import { getEvents } from '@/lib/server/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const days = parseDays(request);
    const events = await getEvents(periodStart(days));
    return new Response(eventsCSV(events), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="portfolio-indicadores-${days}dias.csv"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) { return failure(error); }
}
