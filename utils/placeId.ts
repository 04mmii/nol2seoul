/**
 * Lookup for cultural-space and night-spot favorites/routes.
 * Space/spot IDs are still array indexes (BUG-08 open for them). The saved title is checked so an
 * index that now points at another place is treated as "not found" instead of showing the wrong place.
 */
import type { CulturalSpace, NightViewSpot } from '../types';

const same = (a?: string, b?: string) => (a || '').trim() === (b || '').trim();

export function findSpace(spaces: CulturalSpace[], id: string, title?: string): { space: CulturalSpace; id: string } | undefined {
  const s = /^\d+$/.test(id) ? spaces[Number(id)] : undefined;
  if (!s || (title !== undefined && !same(s.FAC_NAME, title))) return undefined;
  return { space: s, id };
}

export function findSpot(spots: NightViewSpot[], id: string, title?: string): { spot: NightViewSpot; index: number } | undefined {
  const index = /^\d+$/.test(id) ? Number(id) : -1;
  const s = spots[index];
  if (!s || (title !== undefined && !same(s.TITLE, title))) return undefined;
  return { spot: s, index };
}
