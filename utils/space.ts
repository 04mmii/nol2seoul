/**
 * Helpers for culturalSpaceInfo rows (BUG-13, 2026-11-09): read the fields the live API actually sends.
 */
import type { CulturalSpace } from '../types';
import { htmlToParagraphs } from './text';

/** FAC_DESC arrives as HTML (e.g. `<div><span style="…">…</span></div>`) → plain-text paragraphs. */
export const spaceDescription = (html?: string): string[] => htmlToParagraphs(html);

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
