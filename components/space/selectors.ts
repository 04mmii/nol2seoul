/**
 * Space detail v3 data (2026-11-11). Only API fields; nothing invented.
 */
import type { CulturalSpace, Event } from '../../types';
import { eventDay, eventStatus } from '../../utils/event';
import { spaceLatLng } from '../home/selectors';

const norm = (s?: string) => (s || '').replace(/\s+/g, '').replace(/[()[\]·]/g, '').toLowerCase();

/**
 * "이 공간에서 열리는 행사": events whose PLACE contains the space name (spaces/brackets ignored), e.g.
 * "서울생활사박물관 기획전시실" → 서울생활사박물관. Names shorter than 3 characters are not matched (too
 * generic). Running first (by end date), then upcoming (by start date). Live check 2026-11-11: 136 of
 * 1,100 spaces have at least one event.
 */
export function eventsAtSpace(events: Event[], space: CulturalSpace, now: Date = new Date(), limit = 8): Event[] {
  const name = norm(space.FAC_NAME);
  if (name.length < 3) return [];
  const hits = events.filter((e) => norm(e.PLACE).includes(name) && eventStatus(e, now).kind !== 'ended');
  const ongoing = (e: Event) => eventStatus(e, now).kind === 'ongoing';
  return hits
    .sort((a, b) => Number(ongoing(b)) - Number(ongoing(a))
      || (ongoing(a) ? eventDay(a.END_DATE).localeCompare(eventDay(b.END_DATE)) : eventDay(a.STRTDATE).localeCompare(eventDay(b.STRTDATE))))
    .slice(0, limit);
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Straight-line distance label: "약 350m" / "약 1.2km" (not walking time — the API has no route data). */
export const distanceLabel = (km: number) => (km < 1 ? `약 ${Math.max(50, Math.round(km * 20) * 50)}m` : `약 ${km.toFixed(1)}km`);

/** "가까운 공간": the `n` closest other spaces with coordinates (straight line). */
export function nearbySpaces(spaces: CulturalSpace[], space: CulturalSpace, n = 4): Array<{ space: CulturalSpace; km: number }> {
  const at = spaceLatLng(space);
  if (!at) return [];
  return spaces
    .filter((s) => s !== space)
    .flatMap((s) => { const ll = spaceLatLng(s); return ll ? [{ space: s, km: distanceKm(at, ll) }] : []; })
    .filter((x) => x.km > 0.001 || x.space.FAC_NAME !== space.FAC_NAME)
    .sort((a, b) => a.km - b.km)
    .slice(0, n);
}

/** Info rows (only fields the API sends; empty ones are dropped). */
export function spaceInfoRows(s: CulturalSpace): Array<{ label: string; value: string; href?: string }> {
  const homepage = (s.HOMEPAGE || '').trim();
  return [
    { label: '주소', value: (s.ADDR || '').trim() },
    { label: '전화', value: (s.PHNE || '').trim() },
    { label: '휴관일', value: (s.CLOSEDAY || '').trim() },
    { label: '입장료', value: (s.ENTRFREE || '').trim() },
    { label: '홈페이지', value: homepage.replace(/^https?:\/\//, '').replace(/\/$/, ''), href: /^https?:\/\//.test(homepage) ? homepage : undefined },
  ].filter((r) => r.value);
}
