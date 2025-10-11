import { create } from "zustand";
import { persist } from "zustand/middleware";

type SectionKey =
  | "queryBuilder"
  | "filters"
  | "grouping"
  | "advanced";

interface UIState {
  // State
  showHistory: boolean;
  isManualEdit: boolean;
  showMobileSidebar: boolean;
  sectionsExpanded: Record<SectionKey, boolean>;

  // Actions
  setShowHistory: (show: boolean) => void;
  setIsManualEdit: (isManual: boolean) => void;
  toggleHistory: () => void;
  setShowMobileSidebar: (show: boolean) => void;
  toggleMobileSidebar: () => void;
  toggleSection: (section: SectionKey) => void;
}

const initialState = {
  showHistory: false,
  isManualEdit: false,
  showMobileSidebar: false,
  sectionsExpanded: {
    queryBuilder: true,
    filters: true,
    grouping: true,
    advanced: true,
  } as Record<SectionKey, boolean>,
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ...initialState,
      setShowHistory: (showHistory) => set({ showHistory }),
      setIsManualEdit: (isManualEdit) => set({ isManualEdit }),
      toggleHistory: () =>
        set((state) => ({ showHistory: !state.showHistory })),
      setShowMobileSidebar: (showMobileSidebar) => set({ showMobileSidebar }),
      toggleMobileSidebar: () =>
        set((state) => ({ showMobileSidebar: !state.showMobileSidebar })),
      toggleSection: (section) =>
        set((state) => ({
          sectionsExpanded: {
            ...state.sectionsExpanded,
            [section]: !state.sectionsExpanded[section],
          },
        })),
    }),
    {
      name: "sculptql-ui-store",
      partialize: (state) => ({
        showHistory: state.showHistory,
        sectionsExpanded: state.sectionsExpanded,
      }),
    }
  )
);
