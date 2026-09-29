import 'server-only';
import { z } from 'zod';
import type { AnalyticsEvent } from './storage';
import { ServiceError } from './config';

export const trackingSchema = z.object({
  type: z.enum(['pageview', 'click']),
  target: z.string().regex(/^[a-z0-9][a-z0-9:_-]{0,79}$/),
  path: z.literal('/'),
  visitorId: z.string().uuid(),
  referrer: z.string().max(2048).optional(),
  analyticsConsent: z.boolean().optional(),
}).strict();

function cleanGeo(value: string | null, length: number): string {
  if (!value) return '';
  try { return decodeURIComponent(value).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, length); }
  catch { return ''; }
}

export function requestMetadata(request: Request): Pick<AnalyticsEvent, 'country' | 'city' | 'device'> {
  const ua = request.headers.get('user-agent') || '';
  let device: AnalyticsEvent['device'] = 'Desconhecido';
  if (ua) device = /ipad|tablet/i.test(ua) ? 'Tablet' : /mobi|android|iphone/i.test(ua) ? 'Mobile' : 'Desktop';
  return {
    country: process.env.VERCEL ? cleanGeo(request.headers.get('x-vercel-ip-country'), 2).toUpperCase() : '',
    city: process.env.VERCEL ? cleanGeo(request.headers.get('x-vercel-ip-city'), 80) : '',
    device,
  };
}

export function referrerHost(raw?: string): string {
  if (!raw) return 'Direto';
  try {
    const url = new URL(raw);
    return ['http:', 'https:'].includes(url.protocol) ? url.hostname.slice(0, 253) : 'Direto';
  } catch { return 'Direto'; }
}

export function parseDays(request: Request): 7 | 30 | 90 {
  const value = new URL(request.url).searchParams.get('days') || '30';
  if (!['7', '30', '90'].includes(value)) throw new ServiceError(400, 'Selecione um período de 7, 30 ou 90 dias.');
  return Number(value) as 7 | 30 | 90;
}

export function periodStart(days: number, now = new Date()): Date {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return start;
}

export function summarizeEvents(events: AnalyticsEvent[], days: number, now = new Date()) {
  const start = periodStart(days, now);
  const filtered = events.filter(event => event.createdAt >= start && event.createdAt <= now);
  const uniqueVisitors = (items: AnalyticsEvent[]) => new Set(items.filter(event => event.visitorId).map(event => event.visitorId)).size;
  const daily = Array.from({ length: days }, (_, index) => {
    const date = new Date(start.getTime() + index * 86400_000).toISOString().slice(0, 10);
    const items = filtered.filter(event => event.createdAt.toISOString().slice(0, 10) === date);
    return { date, pageviews: items.filter(event => event.type === 'pageview').length, visitors: uniqueVisitors(items), clicks: items.filter(event => event.type === 'click').length, downloads: items.filter(event => event.type === 'download').length };
  });
  const countBy = (items: AnalyticsEvent[], select: (event: AnalyticsEvent) => string) => {
    const grouped = new Map<string, number>();
    for (const event of items) { const key = select(event); grouped.set(key, (grouped.get(key) || 0) + 1); }
    return Array.from(grouped.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  };
  const pageviews = filtered.filter(event => event.type === 'pageview');
  return {
    periodDays: days,
    generatedAt: now.toISOString(),
    totals: { pageviews: pageviews.length, visitors: uniqueVisitors(filtered), clicks: filtered.filter(event => event.type === 'click').length, downloads: filtered.filter(event => event.type === 'download').length },
    daily,
    topClicks: countBy(filtered.filter(event => event.type === 'click'), event => event.target).map(({ name, count }) => ({ target: name, count })).slice(0, 15),
    locations: countBy(pageviews, event => JSON.stringify([event.country || 'Não informado', event.city || 'Não informada'])).map(({ name, count }) => { const [country, city] = JSON.parse(name) as string[]; return { country, city, count }; }).slice(0, 15),
    referrers: countBy(pageviews, event => event.referrer || 'Direto').slice(0, 15),
    devices: countBy(pageviews, event => event.device),
    recentEvents: [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 25).map(({ id, type, target, path, createdAt, country, city, device }) => ({ id, type, target, path, createdAt: createdAt.toISOString(), country, city, device })),
  };
}

export function csvCell(value: string | number): string {
  let text = String(value);
  // Spreadsheet applications can execute formula-looking cells on CSV import.
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function eventsCSV(events: AnalyticsEvent[]): string {
  const header = ['Data UTC', 'Tipo', 'Destino', 'Página', 'País', 'Cidade', 'Dispositivo', 'Origem'];
  const rows = events.map(event => [event.createdAt.toISOString(), event.type, event.target, event.path, event.country, event.city, event.device, event.referrer]);
  return '\uFEFF' + [header, ...rows].map(row => row.map(csvCell).join(';')).join('\r\n');
}
