import { useState, useCallback, useEffect } from 'react';

export type FavoriteType = 'event' | 'space' | 'spot';

export interface FavoriteItem {
  id: string;
  type: FavoriteType;
  title: string;
  location: string;
  image?: string;
  category?: string;
  date?: string;
  savedAt: number;
  /** BUG-08 migration: a saved event that couldn't be matched to current data ("정보를 불러올 수 없는 행사"). */
  orphan?: boolean;
}

export const FAVORITES_STORAGE_KEY = 'nolseoul-favorites';
const STORAGE_KEY = FAVORITES_STORAGE_KEY;
/** Fired on window whenever favorites are written, so every hook instance re-reads them (BUG-08). */
const CHANGE_EVENT = 'nolseoul-favorites-change';

export function loadFavorites(): FavoriteItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveFavorites(items: FavoriteItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(loadFavorites);

  // Keep every instance in sync (another component, the BUG-08 migration, or another tab wrote
  // to storage). Without this, an instance holding stale state could overwrite newer data.
  useEffect(() => {
    const reload = () => setFavorites(loadFavorites());
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) reload(); };
    window.addEventListener(CHANGE_EVENT, reload);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, reload);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Writes start from what is in storage now (not this instance's state), then notify all instances.
  const addFavorite = useCallback((item: Omit<FavoriteItem, 'savedAt'>) => {
    const prev = loadFavorites();
    if (prev.some(f => f.id === item.id && f.type === item.type)) return;
    const updated = [{ ...item, savedAt: Date.now() }, ...prev];
    setFavorites(updated);
    saveFavorites(updated);
  }, []);

  const removeFavorite = useCallback((id: string, type: FavoriteType) => {
    const updated = loadFavorites().filter(f => !(f.id === id && f.type === type));
    setFavorites(updated);
    saveFavorites(updated);
  }, []);

  const isFavorite = useCallback((id: string, type: FavoriteType) => {
    return favorites.some(f => f.id === id && f.type === type);
  }, [favorites]);

  const toggleFavorite = useCallback((item: Omit<FavoriteItem, 'savedAt'>) => {
    if (isFavorite(item.id, item.type)) {
      removeFavorite(item.id, item.type);
    } else {
      addFavorite(item);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  const getByType = useCallback((type: FavoriteType) => {
    return favorites.filter(f => f.type === type);
  }, [favorites]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    getByType,
    eventCount: favorites.filter(f => f.type === 'event').length,
    spaceCount: favorites.filter(f => f.type === 'space').length,
    spotCount: favorites.filter(f => f.type === 'spot').length,
  };
};
