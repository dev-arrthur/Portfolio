import { clearSessionCookie, revokeSession } from '@/lib/server/auth';
import { checkOrigin, failure, json } from '@/lib/server/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await revokeSession(request);
    const response = json({ ok: true });
    clearSessionCookie(response);
    return response;
  } catch (error) { return failure(error); }
}
