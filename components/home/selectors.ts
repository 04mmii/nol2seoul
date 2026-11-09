/**
 * Pure data selectors for the v3 Home. They map Seoul Open API rows to what the design needs.
 * Mapping (approved 2026-11-09):
 *   hero banner, event grid      → event  (culturalEventInfo)
 *   category strip, map promo    → space  (culturalSpaceInfo) — event counts also shown in the strip
 *   After Dark                   → night  (viewNightSpot)
 */
import type { Event, CulturalSpace, NightViewSpot } from '../../types';
import { dateKeys, eventDay as day, isFreeEvent } from '../../utils/event';

// Shared event helpers now live in utils/event.ts; re-exported for existing imports.
export { dateKeys, isFreeEvent, eventPrice, eventVenue } from '../../utils/event';

export type EventTab = 'today' | 'week' | 'month' | 'free';

export function filterEventsByTab(events: Event[], tab: EventTab, now: Date = new Date()): Event[] {
  const { today, weekLater, monthEnd } = dateKeys(now);
  const notEnded = (e: Event) => day(e.END_DATE) >= today;
  switch (tab) {
    case 'today':
      return events.filter((e) => day(e.STRTDATE) <= today && notEnded(e));
    case 'week':
      return events.filter((e) => day(e.STRTDATE) <= weekLater && notEnded(e));
    case 'month':
      return events.filter((e) => day(e.STRTDATE) <= monthEnd && notEnded(e));
    case 'free':
      // Free events that have not ended yet (ongoing or upcoming).
      return events.filter((e) => notEnded(e) && isFreeEvent(e));
  }
}

/** Events starting between today and 7 days from now (inclusive). */
export function countStartingThisWeek(events: Event[], now: Date = new Date()): number {
  const { today, weekLater } = dateKeys(now);
  return events.filter((e) => day(e.STRTDATE) >= today && day(e.STRTDATE) <= weekLater).length;
}

/** Up to `n` hero events: ongoing today with an image first, then any event with an image, then any. */
export function pickHeroEvents(events: Event[], now: Date = new Date(), n = 3): Event[] {
  const ongoing = filterEventsByTab(events, 'today', now);
  const ranked = [
    ...ongoing.filter((e) => e.MAIN_IMG),
    ...events.filter((e) => e.MAIN_IMG),
    ...ongoing,
    ...events,
  ];
  return [...new Set(ranked)].slice(0, n);
}

/** Most frequent values of `key`, descending. Empty/undefined values are ignored. */
export function topCounts<T>(items: T[], key: (item: T) => string | undefined, n: number): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item)?.trim();
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

/** "서울특별시 중구 …" → "중구". */
export function districtFromAddress(addr?: string): string {
  return addr?.match(/([가-힣]+구)(?=\s|$)/)?.[1] ?? '';
}

// Rough bounding box of Seoul, used to place decorative pins in the map promo.
const SEOUL_BOUNDS = { latMin: 37.413, latMax: 37.715, lngMin: 126.734, lngMax: 127.269 };

/**
 * Cultural-space coordinates. The API returns latitude in X_COORD and longitude in Y_COORD
 * (same interpretation as MapDiscovery.tsx). If a row is already lng/lat, swap it back.
 */
export function spaceLatLng(space: CulturalSpace): { lat: number; lng: number } | null {
  const a = Number(space.X_COORD);
  const b = Number(space.Y_COORD);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0 || b === 0) return null;
  const [lat, lng] = a > 90 ? [b, a] : [a, b];
  return { lat, lng };
}

/** Projects a lat/lng to percentage offsets inside the Seoul box, or null if outside. */
export function projectToSeoulBox(lat: number, lng: number): { top: number; left: number } | null {
  const { latMin, latMax, lngMin, lngMax } = SEOUL_BOUNDS;
  if (lat < latMin || lat > latMax || lng < lngMin || lng > lngMax) return null;
  // Keep a margin so pins and labels stay inside the panel.
  const pad = 8;
  const top = pad + ((latMax - lat) / (latMax - latMin)) * (100 - pad * 2);
  const left = pad + ((lng - lngMin) / (lngMax - lngMin)) * (100 - pad * 2);
  return { top, left };
}

/** "2026.11.09 MON" in Korea time. */
export function formatMastheadDate(now: Date = new Date()): string {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', weekday: 'short' }).format(now).toUpperCase();
  return `${ymd.replace(/-/g, '.')} ${wd}`;
}

export const formatCount = (n: number) => n.toLocaleString('ko-KR');

export type NightSpotView = {
  spot: NightViewSpot;
  district: string;
};

export function pickNightSpots(spots: NightViewSpot[], n = 4): NightSpotView[] {
  return spots.slice(0, n).map((spot) => ({ spot, district: districtFromAddress(spot.ADDR) }));
}
