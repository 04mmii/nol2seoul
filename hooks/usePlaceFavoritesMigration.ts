import { useEffect } from 'react';
import type { CulturalSpace, NightViewSpot } from '../types';
import { loadFavorites, saveFavorites, FAVORITES_STORAGE_KEY } from './useFavorites';
import { migratePlaceFavorites, needsPlaceMigration } from '../utils/placeFavoritesMigration';

/** "1" = space/spot favorites use stable IDs (2026-11-11). Independent of the event flag. */
export const PLACE_FAVORITES_VERSION_KEY = 'nolseoul-favorites-places-version';
/** Untouched copy of the favorites as they were before the space/spot migration. */
export const PLACE_FAVORITES_BACKUP_KEY = 'nolseoul-favorites-v2-backup';

/** True when the space/spot migration still has to run (old index IDs are saved). Cheap: storage only. */
export function placeMigrationPending(): boolean {
  try {
    if (localStorage.getItem(PLACE_FAVORITES_VERSION_KEY) === '1') return false;
    if (!loadFavorites().some(needsPlaceMigration)) {
      localStorage.setItem(PLACE_FAVORITES_VERSION_KEY, '1');
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Runs the space/spot favorites migration once, after BOTH datasets have loaded
 * (waits while either is empty, so a network error never orphans a favorite).
 */
export function usePlaceFavoritesMigration(spaces: CulturalSpace[], spots: NightViewSpot[]) {
  useEffect(() => {
    if (spaces.length === 0 || spots.length === 0) return;
    try {
      if (localStorage.getItem(PLACE_FAVORITES_VERSION_KEY) === '1') return;
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (raw !== null && localStorage.getItem(PLACE_FAVORITES_BACKUP_KEY) === null) {
        localStorage.setItem(PLACE_FAVORITES_BACKUP_KEY, raw);
      }
      const items = loadFavorites();
      if (items.length > 0) saveFavorites(migratePlaceFavorites(items, spaces, spots).items);
      localStorage.setItem(PLACE_FAVORITES_VERSION_KEY, '1');
    } catch {
      // Storage unavailable: leave data as is and retry next load.
    }
  }, [spaces, spots]);
}
