/**
 * Stable event IDs — DESIGN.md BUG-08 (decided 2026-11-09: option A with B as fallback).
 *
 * A. `cultcode` from HMPG_ADDR (Seoul culture portal ID, e.g. "…view.do?cultcode=158770").
 *    Live check 2026-11-09: present in 19,750 / 19,750 rows, 0 duplicates.
 * B. Fallback when there is no cultcode: "h" + FNV-1a hash of TITLE | start date | PLACE.
 *    (17 collisions in the full dataset, 0 among current events.)
 *
 * IDs are strings used in routes (`/event/:id`) and favorites. Cultcodes are 6+ digits
 * (135306–160164 today), so they never look like the old array indexes (0–999).
 */
import type { Event } from '../types';

const CULTCODE = /[?&]cultcode=(\d+)/;

export function cultcodeOf(e: Pick<Event, 'HMPG_ADDR'>): string | null {
  return (CULTCODE.exec(e.HMPG_ADDR || '') || [])[1] ?? null;
}

/** 32-bit FNV-1a, base36. Deterministic across browsers. */
function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export function eventId(e: Pick<Event, 'HMPG_ADDR' | 'TITLE' | 'STRTDATE' | 'PLACE'>): string {
  const code = cultcodeOf(e);
  if (code) return code;
  return `h${fnv1a(`${(e.TITLE || '').trim()}|${(e.STRTDATE || '').slice(0, 10)}|${(e.PLACE || '').trim()}`)}`;
}

/** Cultcode-style ID (6+ digits). */
export const isCultcodeId = (id: string) => /^\d{6,}$/.test(id);

/** Old index-style IDs ("0"…"99999"): links/favorites from before BUG-08. */
export const isLegacyIndexId = (id: string) => /^\d{1,5}$/.test(id);

export function findEventById<T extends Pick<Event, 'HMPG_ADDR' | 'TITLE' | 'STRTDATE' | 'PLACE'>>(events: T[], id: string | undefined): T | undefined {
  if (!id || isLegacyIndexId(id)) return undefined;
  return events.find((e) => eventId(e) === id);
}
