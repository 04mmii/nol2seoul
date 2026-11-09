/**
 * Helpers for culturalSpaceInfo rows (BUG-13, 2026-11-09): read the fields the live API actually sends.
 */
import type { CulturalSpace } from '../types';

const ENTITIES: Record<string, string> = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&middot;': '·' };

/**
 * FAC_DESC arrives as HTML (e.g. `<div><span style="…">…</span></div>`). Returns plain-text paragraphs:
 * block tags become line breaks, all other tags are removed, common entities decoded. Rendered as text
 * (never as HTML), so nothing from the API is injected into the page.
 */
export function spaceDescription(html?: string): string[] {
  if (!html) return [];
  const text = html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|h[1-6]|li|tr)\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(nbsp|amp|lt|gt|quot|#39|middot);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  return text.split(/\n+/).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

/** A transit value worth showing: non-empty and not just a bare number (live data has e.g. "12"). */
const meaningful = (v?: string) => {
  const s = (v ?? '').trim();
  return s && !/^\d+$/.test(s) ? s : '';
};

/** 교통 안내 from SUBWAY / BUSSTOP (replaces the non-existent TRAFFIC_INFO). */
export function spaceTransit(s: Pick<CulturalSpace, 'SUBWAY' | 'BUSSTOP'>): Array<{ label: string; value: string }> {
  return [
    { label: '지하철', value: meaningful(s.SUBWAY) },
    { label: '버스', value: meaningful(s.BUSSTOP) },
  ].filter((r) => r.value);
}
