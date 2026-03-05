import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { User } from "../types/user";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: (accessToken: string, refreshToken: string, user: User) => void;
  updateAccessToken: (accessToken: string) => void;
  logout: () => void;
}

const SecureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user }),
      updateAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => SecureStorage),
    },
  ),
);
