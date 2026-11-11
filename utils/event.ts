/**
 * Shared helpers for Seoul culturalEventInfo rows (used by v3 Home and EventDetail).
 */
import type { Event } from '../types';
import { feeLabel, isFree } from './fee';

export const eventDay = (s?: string) => (s || '').slice(0, 10);

/** Today's date in Korea (UTC+9, no DST) as YYYY-MM-DD. (Same formula as api/_lib/seoulApi.ts `kstToday`.) */
export const kstToday = (now: Date = new Date()) => new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

/** Not ended as of today in Korea. A missing/invalid END_DATE counts as not ended (same rule as the proxy). */
export const isNotEndedKst = (e: Pick<Event, 'END_DATE'>, now: Date = new Date()) => {
  const end = (e.END_DATE || '').slice(0, 10);
  return !/^\d{4}-\d{2}-\d{2}$/.test(end) || end >= kstToday(now);
};

/**
 * Client-side guard (TECH-10): the proxy response is CDN-cached for up to 24 h (+24 h stale), so an
 * event can end while the cached list still contains it. `useEvents` runs every list through this,
 * so Home, EventList, EventDetail ("다음으로 가볼 곳"), search and the map never show ended events.
 */
export const dropEndedEvents = <T extends Pick<Event, 'END_DATE'>>(events: T[], now: Date = new Date()) =>
  events.filter((e) => isNotEndedKst(e, now));

/**
 * Date keys as UTC ISO dates (YYYY-MM-DD) — same semantics as the pre-v3 pages, so results don't
 * change. Note: between 00:00 and 09:00 KST, "today" is still the previous UTC day (DESIGN.md §12).
 */
export function dateKeys(now: Date = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  return { today, weekLater, monthEnd };
}

/** Free = fee kind "free" (utils/fee.ts, BUG-03 option D). Shared by EventList, Home and EventDetail. */
export const isFreeEvent = (e: Event) => isFree(e);

/** Short price label for cards. */
export const eventPrice = (e: Event) => feeLabel(e);

export const eventVenue = (e: Event) => e.PLACE || e.GUNAME || '';

/**
 * Compact card date (design-ref format): "11.01 — 11.05"; a single day → "11.01";
 * different years → the end date carries a 2-digit year: "12.20 — 26.01.10".
 * Falls back to the raw DATE field when the dates can't be parsed. Detail pages keep full dates.
 */
export type CardDateParts = { start: string; end: string | null } | null;

/** Parts of the compact card date: start "MM.DD", end "MM.DD" / "YY.MM.DD" (null for a single day). */
export function eventCardDateParts(e: Event): CardDateParts {
  const [rawStart, rawEnd] = (e.DATE || '').split('~').map((s) => s.trim());
  const parse = (s?: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
    return m ? { y: m[1], md: `${m[2]}.${m[3]}` } : null;
  };
  const start = parse(e.STRTDATE) ?? parse(rawStart);
  const end = parse(e.END_DATE) ?? parse(rawEnd) ?? start;
  if (!start || !end) return null;
  if (start.y === end.y && start.md === end.md) return { start: start.md, end: null };
  return { start: start.md, end: start.y === end.y ? end.md : `${end.y.slice(2)}.${end.md}` };
}

export function eventCardDate(e: Event): string {
  const p = eventCardDateParts(e);
  if (!p) return e.DATE || '';
  return p.end ? `${p.start} — ${p.end}` : p.start;
}

/** "2026-11-01 ~ 2026-11-05", or the raw DATE field. */
export const eventDateRange = (e: Event) =>
  e.STRTDATE && e.END_DATE ? `${eventDay(e.STRTDATE)} ~ ${eventDay(e.END_DATE)}` : e.DATE || '';

const DAY_MS = 24 * 60 * 60 * 1000;
const daysBetween = (fromIso: string, toIso: string) =>
  Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / DAY_MS);

export type EventStatus =
  | { kind: 'upcoming'; daysToStart: number }
  | { kind: 'ongoing'; daysToEnd: number }
  | { kind: 'ended' }
  | { kind: 'unknown' };

export function eventStatus(e: Event, now: Date = new Date()): EventStatus {
  const start = eventDay(e.STRTDATE);
  const end = eventDay(e.END_DATE);
  if (!start || !end) return { kind: 'unknown' };
  const { today } = dateKeys(now);
  if (end < today) return { kind: 'ended' };
  if (start > today) return { kind: 'upcoming', daysToStart: daysBetween(today, start) };
  return { kind: 'ongoing', daysToEnd: daysBetween(today, end) };
}

/** Deadline badge for cards and search: "D-n" when the event ends within 7 days (today = "D-DAY"), else null. */
export function eventDday(e: Event, now: Date = new Date()): string | null {
  const st = eventStatus(e, now);
  if (st.kind !== 'ongoing' || st.daysToEnd > 7) return null;
  return st.daysToEnd === 0 ? 'D-DAY' : `D-${st.daysToEnd}`;
}

export function eventStatusLabel(s: EventStatus): string {
  switch (s.kind) {
    case 'upcoming':
      return `D-${s.daysToStart} · 개막 예정`;
    case 'ongoing':
      return s.daysToEnd === 0 ? '진행 중 · 오늘 종료' : `진행 중 · 종료 D-${s.daysToEnd}`;
    case 'ended':
      return '종료된 행사';
    default:
      return '';
  }
}

/** Event coordinates. In live data LAT is latitude (37.x) and LOT is longitude (126–127.x). */
export function eventLatLng(e: Event): { lat: number; lng: number } | null {
  const lat = parseFloat(e.LAT ?? '');
  const lng = parseFloat(e.LOT ?? '');
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) return null;
  // Defensive: swap if a row ever arrives as lng/lat.
  return lat > 90 ? { lat: lng, lng: lat } : { lat, lng };
}
