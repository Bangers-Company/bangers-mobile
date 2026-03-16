import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { User } from "../types/user";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: (accessToken: string, refreshToken: string, user: User) => void;
  setUser: (user: User) => void;
  updateAccessToken: (accessToken: string) => void;
  updateFriendsCount: (delta: number) => void;
  logout: () => void;
}

const isWeb = Platform.OS === "web";

const SecureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (isWeb) {
      return localStorage.getItem(name);
    }
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (isWeb) {
      localStorage.setItem(name, value);
      return;
    }
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (isWeb) {
      localStorage.removeItem(name);
      return;
    }
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
      setUser: (user) => set((state) => ({ 
        user: state.user ? { ...state.user, ...user } : user 
      })),
      updateAccessToken: (accessToken) => set({ accessToken }),
      updateFriendsCount: (delta) => set((state) => {
        if (!state.user) return state;
        return {
          user: {
            ...state.user,
            friends_count: (state.user.friends_count || 0) + delta
          }
        };
      }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => SecureStorage),
      partialize: (state) => ({ 
        accessToken: state.accessToken, 
        refreshToken: state.refreshToken 
      }),
    },
  ),
);
