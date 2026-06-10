import { logger } from '../config/logger';

export function sanitizeDate(val: unknown): string | null {
  if (!val || typeof val !== 'string') return null;
  const s = val.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
}

export function sanitizeSelect(val: unknown, valid: string[], fallback: string, context?: string): string {
  let s: string;
  if (typeof val === 'string') s = val.trim();
  else if (Array.isArray(val) && val.length > 0) s = String(val[0]).trim();
  else if (val == null || val === '') return fallback;
  else s = String(val).trim();

  if (!s) return fallback;

  const candidate = s.split(',')[0].trim();

  if (!valid || valid.length === 0) {
    return candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
  }

  if (valid.includes(candidate)) return candidate;

  const lower = candidate.toLowerCase();
  const ci = valid.find((v) => v.toLowerCase() === lower);
  if (ci) return ci;

  const firstWord = candidate.split(/\s+/)[0].toLowerCase();
  const fw = valid.find((v) => v.toLowerCase().startsWith(firstWord) || firstWord.startsWith(v.toLowerCase()));
  if (fw) return fw;

  const sub = valid.find((v) => lower.includes(v.toLowerCase()));
  if (sub) return sub;

  logger.warn({ value: val, fallback, context }, 'sanitizeSelect: no match — Claude returned unexpected value, using fallback');
  return fallback;
}
