/**
 * Data shaping for the v3 MyPage (design-ref "Search and My v3" M1–M3; decisions 2026-11-10).
 * Everything comes from the favorites saved in this browser + current API data + today's date.
 * No visit history, levels, badges or other data we don't have.
 *
 * Fixed order (no sort control): ongoing/upcoming events by end date → lit night spots → other
 * night spots → cultural spaces → ended / unavailable favorites (never deleted automatically).
 */
import type { CulturalSpace, Event, NightViewSpot } from '../../types';
import type { FavoriteItem, FavoriteType } from '../../hooks/useFavorites';
import { dateKeys, eventDay, eventStatus } from '../../utils/event';
import { findEventById } from '../../utils/eventId';
import { favoriteEndDate } from '../../utils/favoritesMigration';
import { kstToday } from '../../utils/event';
import { findSpace, findSpot } from '../../utils/placeId';
import type { NightSpotView } from '../night/selectors';

export type MyEntry =
  | { kind: 'event'; fav: FavoriteItem; event: Event }
  | { kind: 'space'; fav: FavoriteItem; space: CulturalSpace; id: string }
  | { kind: 'spot'; fav: FavoriteItem; view: NightSpotView }
  /** Saved item not in current data. `ended` = stored end date before today (events only). */
  | { kind: 'gone'; fav: FavoriteItem; reason: 'ended' | 'lost' }
  /** Data for this type hasn't loaded (loading or API error) — show the stored fields, no verdict. */
  | { kind: 'pending'; fav: FavoriteItem };

export type MyTab = 'all' | FavoriteType;

export const GONE_LABEL: Record<FavoriteType, string> = {
  event: '정보를 불러올 수 없는 행사',
  space: '정보를 불러올 수 없는 장소',
  spot: '정보를 불러올 수 없는 야경명소',
};

export function goneLabel(e: Extract<MyEntry, { kind: 'gone' }>) {
  return e.reason === 'ended' ? '종료된 행사' : GONE_LABEL[e.fav.type];
}

export function resolveFavorites(
  favorites: FavoriteItem[],
  data: { events: Event[]; spaces: CulturalSpace[]; spots: NightViewSpot[]; nightViews: NightSpotView[] },
  now: Date = new Date(),
): MyEntry[] {
  const today = kstToday(now);
  return favorites.map((fav): MyEntry => {
    if (fav.type === 'event') {
      const ev = fav.orphan ? undefined : findEventById(data.events, fav.id);
      if (ev && eventStatus(ev, now).kind !== 'ended') return { kind: 'event', fav, event: ev };
      if (!fav.orphan && data.events.length === 0) return { kind: 'pending', fav };
      const end = ev ? eventDay(ev.END_DATE) : favoriteEndDate(fav);
      return { kind: 'gone', fav, reason: end && end < today ? 'ended' : 'lost' };
    }
    if (fav.type === 'space') {
      if (data.spaces.length === 0) return { kind: 'pending', fav };
      const hit = findSpace(data.spaces, fav.id, fav.title);
      return hit ? { kind: 'space', fav, space: hit.space, id: hit.id } : { kind: 'gone', fav, reason: 'lost' };
    }
    if (data.spots.length === 0 || data.nightViews.length === 0) return { kind: 'pending', fav };
    const hit = findSpot(data.spots, fav.id, fav.title);
    const view = hit ? data.nightViews[hit.index] : undefined;
    return view ? { kind: 'spot', fav, view } : { kind: 'gone', fav, reason: 'lost' };
  });
}

const rank = (e: MyEntry): number => {
  switch (e.kind) {
    case 'event': return 0;
    case 'spot': return e.view.glowing ? 1 : 2;
    case 'space': return 3;
    case 'pending': return 4;
    default: return 5;
  }
};

/** 마감 임박순 (fixed). Ties keep the saved order (newest first). */
export function sortEntries(entries: MyEntry[]): MyEntry[] {
  return entries
    .map((e, i) => ({ e, i }))
    .sort((a, b) => {
      const r = rank(a.e) - rank(b.e);
      if (r) return r;
      if (a.e.kind === 'event' && b.e.kind === 'event') {
        const d = eventDay(a.e.event.END_DATE).localeCompare(eventDay(b.e.event.END_DATE));
        if (d) return d;
      }
      return a.i - b.i;
    })
    .map((x) => x.e);
}

export const entryType = (e: MyEntry): FavoriteType => e.fav.type;

export function myStats(entries: MyEntry[], night: { phase: 'before' | 'lit' | 'late' } | null, now: Date = new Date()) {
  const { today, weekLater } = dateKeys(now);
  const events = entries.filter((e) => e.fav.type === 'event');
  const live = events.flatMap((e) => (e.kind === 'event' ? [e.event] : []));
  const spots = entries.filter((e) => e.fav.type === 'spot');
  return {
    total: entries.length,
    events: events.length,
    ongoing: live.filter((ev) => eventStatus(ev, now).kind === 'ongoing').length,
    /** Same "이번 주" window as the Live Bar (dateKeys: today … today + 7). */
    endingThisWeek: live.filter((ev) => { const end = eventDay(ev.END_DATE); return end >= today && end <= weekLater; }).length,
    spaces: entries.filter((e) => e.fav.type === 'space').length,
    spots: spots.length,
    litSpots: spots.filter((e) => e.kind === 'spot' && e.view.glowing).length,
    beforeSunset: night?.phase === 'before',
  };
}
