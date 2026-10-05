import React, { createContext, useContext, useState, useEffect } from 'react';

interface FavoritesRecentContextValue {
  favorites: string[];
  recentTools: string[];
  toggleFavorite: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
  addRecentTool: (slug: string) => void;
}

const FavoritesRecentContext = createContext<FavoritesRecentContextValue | undefined>(undefined);

export const FavoritesRecentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('th_favorites');
      return saved ? JSON.parse(saved) : ['pdf-merge', 'signature-maker'];
    } catch {
      return ['pdf-merge', 'signature-maker'];
    }
  });

  const [recentTools, setRecentTools] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('th_recents');
      return saved ? JSON.parse(saved) : ['pdf-merge', 'rent-agreement-format'];
    } catch {
      return ['pdf-merge', 'rent-agreement-format'];
    }
  });

  const toggleFavorite = (slug: string) => {
    setFavorites(prev => {
      const next = prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug];
      localStorage.setItem('th_favorites', JSON.stringify(next));
      return next;
    });
  };

  const isFavorite = (slug: string) => favorites.includes(slug);

  const addRecentTool = (slug: string) => {
    setRecentTools(prev => {
      const filtered = prev.filter(s => s !== slug);
      const next = [slug, ...filtered].slice(0, 6);
      localStorage.setItem('th_recents', JSON.stringify(next));
      return next;
    });
  };

  return (
    <FavoritesRecentContext.Provider
      value={{
        favorites,
        recentTools,
        toggleFavorite,
        isFavorite,
        addRecentTool,
      }}
    >
      {children}
    </FavoritesRecentContext.Provider>
  );
};

export function useFavoritesRecent() {
  const context = useContext(FavoritesRecentContext);
  if (!context) {
    throw new Error('useFavoritesRecent must be used within FavoritesRecentProvider');
  }
  return context;
}
