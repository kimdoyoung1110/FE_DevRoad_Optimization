import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';


interface CompanyFavoritesState {
  favoriteCompanyIds: Set<string>;
  toggleFavorite: (companyId: string) => void;
  isFavorite: (companyId: string) => boolean;
  getFavoriteCompanyIds: () => string[];
}

// 저장될 때의 타입 (Set을 배열로 변환)
type PersistedState = {
  favoriteCompanyIds: string[];
};

export const useCompanyFavoritesStore = create<CompanyFavoritesState>()(
  persist(
    (set, get) => ({
      favoriteCompanyIds: new Set<string>(),

      toggleFavorite: (companyId) => {
        set((state) => {
          const newSet = new Set(state.favoriteCompanyIds);
          if (newSet.has(companyId)) {
            newSet.delete(companyId);
          } else {
            newSet.add(companyId);
          }
          return { favoriteCompanyIds: newSet };
        });
      },

      isFavorite: (companyId) => {
        return get().favoriteCompanyIds.has(companyId);
      },

      getFavoriteCompanyIds: () => {
        return Array.from(get().favoriteCompanyIds);
      },
    }),
    {
      name: 'company-favorites-storage',
      storage: createJSONStorage(() => localStorage),
      // 저장 시 Set을 배열로 변환
      partialize: (state): PersistedState => ({
        favoriteCompanyIds: Array.from(state.favoriteCompanyIds),
      }),
      // 불러올 때 배열을 Set으로 변환
      merge: (persistedState, currentState) => {
        const persisted = persistedState as PersistedState;
        return {
          ...currentState,
          favoriteCompanyIds:
            persisted?.favoriteCompanyIds && Array.isArray(persisted.favoriteCompanyIds)
              ? new Set(persisted.favoriteCompanyIds)
              : new Set<string>(),
        };
      },
    }
  )
);
