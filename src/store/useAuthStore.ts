import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { User } from "../types/user";

// Callbacks registered by the app layer for cleanup on logout
const logoutCallbacks: (() => void)[] = [];

export const registerLogoutCallback = (callback: () => void) => {
  logoutCallbacks.push(callback);
};

interface AuthSession {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  session: AuthSession | null;
  user: User | null;
  setAuth: (session: AuthSession, user: User) => void;
  setUser: (user: Partial<User>) => void;
  updateAccessToken: (accessToken: string) => void;
  updateFriendsCount: (delta: number) => void;
  logout: () => void;
}

const isWeb = Platform.OS === "web";

// Memory storage fallback for web to avoid persisting tokens in localStorage
const memoryStorage: Record<string, string | null> = {};

const SecureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (isWeb) {
      return memoryStorage[name] || null;
    }
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (isWeb) {
      memoryStorage[name] = value;
      return;
    }
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (isWeb) {
      delete memoryStorage[name];
      return;
    }
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      setAuth: (session, user) => set({ session, user }),
      setUser: (user) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...user } : (user as User),
        })),
      updateAccessToken: (accessToken) =>
        set((state) => ({
          session: state.session ? { ...state.session, accessToken } : null,
        })),
      updateFriendsCount: (delta) =>
        set((state) => {
          if (!state.user) return state;
          return {
            user: {
              ...state.user,
              friends_count: (state.user.friends_count || 0) + delta,
            },
          };
        }),
      logout: () => {
        set({ session: null, user: null });
        logoutCallbacks.forEach((cb) => cb());
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => SecureStorage),
      partialize: (state) => ({
        session: state.session,
        user: state.user,
      }),
    },
  ),
);
