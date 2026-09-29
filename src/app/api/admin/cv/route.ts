import { requireAdmin } from '@/lib/server/auth';
import { MAX_CV_BYTES, ServiceError } from '@/lib/server/config';
import { cvMetadata, validateCV } from '@/lib/server/cv';
import { checkOrigin, failure, json } from '@/lib/server/security';
import { deleteCV, saveCV } from '@/lib/server/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await requireAdmin(request);
    const length = Number(request.headers.get('content-length') || 0);
    if (length > MAX_CV_BYTES + 64 * 1024) throw new ServiceError(413, 'O currículo deve ter no máximo 3 MB.');
    if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) throw new ServiceError(415, 'Envie o arquivo PDF pelo formulário.');
    if (!request.body) throw new ServiceError(400, 'Selecione um arquivo PDF.');
    // Bound even chunked uploads before letting the multipart parser allocate.
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      size += result.value.length;
      if (size > MAX_CV_BYTES + 64 * 1024) { await reader.cancel(); throw new ServiceError(413, 'O currículo deve ter no máximo 3 MB.'); }
      chunks.push(result.value);
    }
    let form: FormData;
    try { form = await new Response(Buffer.concat(chunks), { headers: { 'Content-Type': request.headers.get('content-type')! } }).formData(); }
    catch { throw new ServiceError(400, 'Não foi possível ler o arquivo enviado.'); }
    const file = form.get('file');
    if (!(file instanceof File)) throw new ServiceError(400, 'Selecione um arquivo PDF.');
    const cv = validateCV(Buffer.from(await file.arrayBuffer()), file.name, file.type);
    await saveCV(cv);
    return json({ ok: true, cv: cvMetadata(cv) });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    await requireAdmin(request);
    await deleteCV();
    return json({ ok: true, cv: { available: false } });
  } catch (error) { return failure(error); }
}
