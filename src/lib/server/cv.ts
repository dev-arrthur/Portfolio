import 'server-only';
import { MAX_CV_BYTES, ServiceError } from './config';
import type { StoredCV, StoredCVMetadata } from './storage';

export function cvMetadata(cv: StoredCVMetadata | null) {
  return cv ? { available: true, filename: cv.filename, updatedAt: cv.updatedAt.toISOString(), size: cv.size } : { available: false };
}

export function validateCV(data: Buffer, filename: string, type: string): StoredCV {
  if (!data.length || data.length > MAX_CV_BYTES) throw new ServiceError(400, 'O currículo deve ter no máximo 3 MB.');
  if (!filename.toLowerCase().endsWith('.pdf') || (type && !['application/pdf', 'application/octet-stream'].includes(type))) throw new ServiceError(400, 'Envie um currículo em formato PDF.');
  if (data.subarray(0, 5).toString('ascii') !== '%PDF-' || !data.subarray(Math.max(0, data.length - 2048)).includes(Buffer.from('%%EOF'))) throw new ServiceError(400, 'O arquivo enviado não é um PDF válido.');
  const safeFilename = filename.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^-+/, '').slice(0, 100);
  return { filename: safeFilename || 'Arthur-Ferreira-Curriculo.pdf', updatedAt: new Date(), size: data.length, data };
}
