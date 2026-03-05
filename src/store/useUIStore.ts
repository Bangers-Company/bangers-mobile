import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "amoled" | "system";

interface UIState {
  themeMode: ThemeMode;
  accentColor: string | null;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: string | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      themeMode: "system",
      accentColor: null,
      setThemeMode: (mode) => set({ themeMode: mode }),
      setAccentColor: (color) => set({ accentColor: color }),
    }),
    {
      name: "ui-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
