/**
 * One-time migration of saved event favorites from array-index IDs to stable IDs (BUG-08).
 *
 * The old `id` (an array index) is NOT trusted — before BUG-01 was fixed, Home saved indexes of a
 * filtered list, so some favorites already point at the wrong event. Each saved event is matched
 * again from the fields stored with it, in this order (the first rule with exactly one candidate wins):
 *   1. same poster URL (`image` === MAIN_IMG)
 *   2. same title + same start date (stored `date` is "YYYY-MM-DD~…" or "YYYY-MM-DD ~ …")
 *   3. same title + same location (PLACE, or GUNAME when PLACE is empty)
 * No match / several matches → the favorite is kept as an orphan ("정보를 불러올 수 없는 행사"):
 * it keeps title/location/date, gets `orphan: true` and an id of "legacy-<old id>".
 * Space/spot favorites are not touched (their IDs are a separate ticket).
 */
import type { Event } from '../types';
import type { FavoriteItem } from '../hooks/useFavorites';
import { eventId, isLegacyIndexId } from './eventId';

export type MigrationStats = { matched: number; orphaned: number; duplicatesDropped: number; untouched: number };

const startOf = (date?: string) => (/(\d{4}-\d{2}-\d{2})/.exec(date || '') || [])[1] ?? '';
const norm = (s?: string) => (s || '').trim();

function matchEvent(item: FavoriteItem, events: Event[]): Event | undefined {
  const one = (list: Event[]) => (list.length === 1 ? list[0] : undefined);
  if (item.image) {
    const hit = one(events.filter((e) => e.MAIN_IMG && e.MAIN_IMG === item.image));
    if (hit) return hit;
  }
  const title = norm(item.title);
  const sameTitle = events.filter((e) => norm(e.TITLE) === title);
  const start = startOf(item.date);
  if (start) {
    const hit = one(sameTitle.filter((e) => (e.STRTDATE || '').slice(0, 10) === start));
    if (hit) return hit;
  }
  const loc = norm(item.location);
  if (loc) {
    const hit = one(sameTitle.filter((e) => norm(e.PLACE || e.GUNAME) === loc));
    if (hit) return hit;
  }
  return undefined;
}

/** Needs migration: an event favorite whose id is still an old index (and not already an orphan). */
const needsMigration = (f: FavoriteItem) => f.type === 'event' && !f.orphan && isLegacyIndexId(f.id);

export function migrateFavorites(items: FavoriteItem[], events: Event[]): { items: FavoriteItem[]; stats: MigrationStats } {
  const stats: MigrationStats = { matched: 0, orphaned: 0, duplicatesDropped: 0, untouched: 0 };
  const out: FavoriteItem[] = [];
  const seen = new Set<string>();
  // Items are stored newest first; keep the first occurrence of each resulting id.
  for (const item of items) {
    let next: FavoriteItem;
    if (!needsMigration(item)) {
      next = item;
      stats.untouched++;
    } else {
      const hit = matchEvent(item, events);
      if (hit) {
        next = { ...item, id: eventId(hit) };
        stats.matched++;
      } else {
        next = { ...item, id: `legacy-${item.id}`, orphan: true };
        stats.orphaned++;
      }
    }
    const key = `${next.type}:${next.id}`;
    if (seen.has(key)) {
      stats.duplicatesDropped++;
      continue;
    }
    seen.add(key);
    out.push(next);
  }
  return { items: out, stats };
}
