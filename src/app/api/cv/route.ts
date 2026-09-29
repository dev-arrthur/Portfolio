import { cvMetadata } from '@/lib/server/cv';
import { configuredStorageName } from '@/lib/server/config';
import { json } from '@/lib/server/security';
import { getCVMetadata } from '@/lib/server/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (configuredStorageName() === 'unconfigured') return json({ available: false });
  try { return json(cvMetadata(await getCVMetadata())); }
  catch { return json({ available: false }); }
}
