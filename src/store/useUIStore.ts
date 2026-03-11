import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";

interface UIState {
  themeMode: ThemeMode;
  isAmoled: boolean;
  accentColor: string | null;
  scrollOffset: number;
  isBottomNavVisible: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setIsAmoled: (isAmoled: boolean) => void;
  setAccentColor: (color: string | null) => void;
  setScrollOffset: (offset: number) => void;
  setIsBottomNavVisible: (visible: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      themeMode: "system",
      isAmoled: false,
      accentColor: null,
      scrollOffset: 0,
      isBottomNavVisible: true,
      setThemeMode: (mode) => set({ themeMode: mode }),
      setIsAmoled: (isAmoled) => set({ isAmoled }),
      setAccentColor: (color) => set({ accentColor: color }),
      setScrollOffset: (offset) => set({ scrollOffset: offset }),
      setIsBottomNavVisible: (visible) => set({ isBottomNavVisible: visible }),
    }),
    {
      name: "ui-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        isAmoled: state.isAmoled,
        accentColor: state.accentColor,
      }),
    },
  ),
);
