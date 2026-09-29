import { authenticated } from '@/lib/server/auth';
import { adminConfigured } from '@/lib/server/config';
import { failure, json } from '@/lib/server/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try { return json({ authenticated: await authenticated(request), configured: adminConfigured() }); }
  catch (error) { return failure(error); }
}
