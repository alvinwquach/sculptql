import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { QueryHistoryItem, PinnedQuery, BookmarkedQuery, LabeledQuery } from '@/app/types/query';
import { useQueryStore } from "./useQueryStore";

interface HistoryState {
  // State
  queryHistory: QueryHistoryItem[];
  pinnedQueries: PinnedQuery[];
  bookmarkedQueries: BookmarkedQuery[];
  labeledQueries: LabeledQuery[];

  // Actions
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  loadQueryFromHistory: (query: string) => void;
  addPinnedQuery: (query: string) => void;
  removePinnedQuery: (id: string) => void;
  addBookmarkedQuery: (query: string) => void;
  removeBookmarkedQuery: (id: string) => void;
  addLabeledQuery: (label: string, historyItemId: string) => void;
  removeLabeledQuery: (historyItemId: string) => void;
  editLabeledQuery: (historyItemId: string, label: string) => void;
}

const initialState = {
  queryHistory: [],
  pinnedQueries: [],
  bookmarkedQueries: [],
  labeledQueries: [],
};

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      ...initialState,

      addToHistory: (query) => {
        if (!query.trim()) return;
        const newItem: QueryHistoryItem = {
          id: uuidv4(),
          query: query.trim(),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          queryHistory: [
            newItem,
            ...state.queryHistory.filter(
              (item) => item.query !== newItem.query
            ),
          ].slice(0, 100),
        }));
      },

      clearHistory: () => set({ queryHistory: [] }),

      loadQueryFromHistory: (query) => {
        // Use the query store to set the query
        const { setQuery } = useQueryStore.getState();
        setQuery(query);
      },

      addPinnedQuery: (query) => {
        const newPinned: PinnedQuery = {
          id: uuidv4(),
          query: query.trim(),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          pinnedQueries: [...state.pinnedQueries, newPinned],
        }));
      },

      removePinnedQuery: (id) =>
        set((state) => ({
          pinnedQueries: state.pinnedQueries.filter((item) => item.id !== id),
        })),

      addBookmarkedQuery: (query) => {
        const newBookmarked: BookmarkedQuery = {
          id: uuidv4(),
          query: query.trim(),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          bookmarkedQueries: [...state.bookmarkedQueries, newBookmarked],
        }));
      },

      removeBookmarkedQuery: (id) =>
        set((state) => ({
          bookmarkedQueries: state.bookmarkedQueries.filter(
            (item) => item.id !== id
          ),
        })),

      addLabeledQuery: (label, historyItemId) => {
        const newLabeled: LabeledQuery = {
          id: uuidv4(),
          historyItemId,
          label: label.trim(),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          labeledQueries: [...state.labeledQueries, newLabeled],
        }));
      },

      removeLabeledQuery: (historyItemId) =>
        set((state) => ({
          labeledQueries: state.labeledQueries.filter(
            (item) => item.historyItemId !== historyItemId
          ),
        })),

      editLabeledQuery: (historyItemId, label) =>
        set((state) => ({
          labeledQueries: state.labeledQueries.map((item) =>
            item.historyItemId === historyItemId
              ? { ...item, label: label.trim() }
              : item
          ),
        })),
    }),
    {
      name: "sculptql-history-store",
    }
  )
);
