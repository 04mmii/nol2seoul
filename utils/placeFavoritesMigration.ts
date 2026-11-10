/**
 * One-time migration of saved cultural-space / night-spot favorites from array-index IDs to stable IDs
 * (utils/placeId.ts, BUG-08 remainder, 2026-11-11). Same approach as the event migration:
 *   - the old index is NOT trusted (the API order changes); each favorite is matched again from its
 *     stored fields: 1. same name + same address (exactly one), 2. same name (exactly one);
 *   - no match / several matches → kept as an orphan ("정보를 불러올 수 없는 장소/야경명소") with
 *     id "legacy-<old id>" and `orphan: true`; never deleted;
 *   - duplicates that end up with the same id are dropped (first, i.e. newest, wins);
 *   - running it again changes nothing (only plain-digit, non-orphan space/spot ids are touched).
 * Event favorites are not touched here (utils/favoritesMigration.ts).
 */
import type { CulturalSpace, NightViewSpot } from '../types';
import type { FavoriteItem } from '../hooks/useFavorites';
import { isLegacyPlaceId, spaceId, spotId } from './placeId';

export type PlaceMigrationStats = { matched: number; orphaned: number; duplicatesDropped: number; untouched: number };

const norm = (s?: string) => (s || '').trim();

function pick<T>(rows: T[], name: (r: T) => string, addr: (r: T) => string, item: FavoriteItem): T | undefined {
  const sameName = rows.filter((r) => norm(name(r)) === norm(item.title));
  const byAddr = sameName.filter((r) => norm(addr(r)) === norm(item.location));
  if (byAddr.length === 1) return byAddr[0];
  if (sameName.length === 1) return sameName[0];
  return undefined;
}

export const needsPlaceMigration = (f: FavoriteItem) => (f.type === 'space' || f.type === 'spot') && !f.orphan && isLegacyPlaceId(f.id);

export function migratePlaceFavorites(items: FavoriteItem[], spaces: CulturalSpace[], spots: NightViewSpot[]): { items: FavoriteItem[]; stats: PlaceMigrationStats } {
  const stats: PlaceMigrationStats = { matched: 0, orphaned: 0, duplicatesDropped: 0, untouched: 0 };
  const out: FavoriteItem[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    let next: FavoriteItem;
    if (!needsPlaceMigration(item)) {
      next = item;
      stats.untouched++;
    } else {
      const newId = item.type === 'space'
        ? (() => { const s = pick(spaces, (r) => r.FAC_NAME, (r) => r.ADDR, item); return s && spaceId(s); })()
        : (() => { const n = pick(spots, (r) => r.TITLE, (r) => r.ADDR, item); return n && spotId(n); })();
      if (newId) {
        next = { ...item, id: newId };
        stats.matched++;
      } else {
        next = { ...item, id: `legacy-${item.id}`, orphan: true };
        stats.orphaned++;
      }
    }
    const key = `${next.type}:${next.id}`;
    if (seen.has(key)) { stats.duplicatesDropped++; continue; }
    seen.add(key);
    out.push(next);
  }
  return { items: out, stats };
}
