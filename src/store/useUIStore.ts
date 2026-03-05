import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "amoled" | "system";

interface UIState {
  themeMode: ThemeMode;
  accentColor: string | null;
  scrollOffset: number;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: string | null) => void;
  setScrollOffset: (offset: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      themeMode: "system",
      accentColor: null,
      scrollOffset: 0,
      setThemeMode: (mode) => set({ themeMode: mode }),
      setAccentColor: (color) => set({ accentColor: color }),
      setScrollOffset: (offset) => set({ scrollOffset: offset }),
    }),
    {
      name: "ui-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        accentColor: state.accentColor,
      }),
    },
  ),
);
