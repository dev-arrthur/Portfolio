import { requireAdmin } from '@/lib/server/auth';
import { adminConfigured, configuredStorageName, RETENTION_DAYS } from '@/lib/server/config';
import { parseDays, periodStart, summarizeEvents } from '@/lib/server/analytics';
import { cvMetadata } from '@/lib/server/cv';
import { failure, json } from '@/lib/server/security';
import { getCVMetadata, getEvents, storageReady } from '@/lib/server/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const days = parseDays(request);
    const [events, cv, ready] = await Promise.all([getEvents(periodStart(days)), getCVMetadata(), storageReady()]);
    return json({
      ...summarizeEvents(events, days),
      cv: cvMetadata(cv),
      setup: { storage: configuredStorageName(), ready, adminConfigured: adminConfigured(), analyticsRetentionDays: RETENTION_DAYS },
    });
  } catch (error) { return failure(error); }
}
