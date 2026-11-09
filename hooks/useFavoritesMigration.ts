import { useEffect } from 'react';
import type { Event } from '../types';
import { loadFavorites, saveFavorites, FAVORITES_STORAGE_KEY } from './useFavorites';
import { migrateFavorites } from '../utils/favoritesMigration';

/** Version flag: "2" = event favorites use stable IDs (BUG-08). */
export const FAVORITES_VERSION_KEY = 'nolseoul-favorites-version';
/** Untouched copy of the favorites as they were before the migration. */
export const FAVORITES_BACKUP_KEY = 'nolseoul-favorites-v1-backup';

/**
 * Runs the BUG-08 favorites migration once, after event data has loaded.
 * Waits while events are empty (loading or failed) so nothing is orphaned by a network error.
 */
export function useFavoritesMigration(events: Event[]) {
  useEffect(() => {
    if (events.length === 0) return;
    try {
      if (localStorage.getItem(FAVORITES_VERSION_KEY) === '2') return;
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const items = loadFavorites();
      if (raw !== null && localStorage.getItem(FAVORITES_BACKUP_KEY) === null) {
        localStorage.setItem(FAVORITES_BACKUP_KEY, raw);
      }
      if (items.length > 0) {
        const { items: migrated } = migrateFavorites(items, events);
        saveFavorites(migrated);
      }
      localStorage.setItem(FAVORITES_VERSION_KEY, '2');
    } catch {
      // Storage unavailable (private mode, quota): leave data as is and retry next load.
    }
  }, [events]);
}
