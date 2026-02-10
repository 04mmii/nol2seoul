import { useState, useCallback } from 'react';

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
}

const STORAGE_KEY = 'nolseoul-favorites';

function loadFavorites(): FavoriteItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveFavorites(items: FavoriteItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(loadFavorites);

  const addFavorite = useCallback((item: Omit<FavoriteItem, 'savedAt'>) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === item.id && f.type === item.type);
      if (exists) return prev;
      const updated = [{ ...item, savedAt: Date.now() }, ...prev];
      saveFavorites(updated);
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((id: string, type: FavoriteType) => {
    setFavorites(prev => {
      const updated = prev.filter(f => !(f.id === id && f.type === type));
      saveFavorites(updated);
      return updated;
    });
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
