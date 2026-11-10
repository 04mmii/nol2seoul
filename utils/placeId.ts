/**
 * Stable IDs for cultural spaces and night spots (BUG-08 remainder, 2026-11-11).
 *
 * The Seoul API has no FAC_CODE; `NUM` is the only key. Checked against live data on 2026-11-11:
 * culturalSpaceInfo 1,100 rows / 1,100 distinct NUM, viewNightSpot 51 rows / 51 distinct NUM, none empty,
 * and NUM is NOT the array position (so it isn't just a row counter of our response).
 * IDs carry a prefix ("s<NUM>", "n<NUM>") so they can never be mistaken for the old array-index IDs
 * (plain digits), which is how the favorites migration and old links are detected.
 */
import type { CulturalSpace, NightViewSpot } from '../types';

export const spaceId = (s: Pick<CulturalSpace, 'NUM'>) => `s${String(s.NUM ?? '').trim()}`;
export const spotId = (n: Pick<NightViewSpot, 'NUM'>) => `n${String(n.NUM ?? '').trim()}`;

/** Old array-index ID (before 2026-11-11). */
export const isLegacyPlaceId = (id: string | null | undefined) => !!id && /^\d+$/.test(id);

export function findSpace(spaces: CulturalSpace[], id: string | null | undefined): { space: CulturalSpace; id: string } | undefined {
  if (!id || isLegacyPlaceId(id)) return undefined;
  const space = spaces.find((s) => spaceId(s) === id);
  return space ? { space, id } : undefined;
}

export function findSpot(spots: NightViewSpot[], id: string | null | undefined): { spot: NightViewSpot; index: number } | undefined {
  if (!id || isLegacyPlaceId(id)) return undefined;
  const index = spots.findIndex((n) => spotId(n) === id);
  return index >= 0 ? { spot: spots[index], index } : undefined;
}
