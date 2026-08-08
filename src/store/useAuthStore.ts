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
  updateSession: (session: AuthSession) => void;
  updateAccessToken: (token: string) => void;
  updateFriendsCount: (delta: number) => void;
  logout: () => void;
}

const isWeb = Platform.OS === "web";

// Memory storage fallback for web to avoid persisting tokens in localStorage
const memoryStorage: Record<string, string | null> = {};

/**
 * SecureStorage: used ONLY for the session (access + refresh tokens).
 * The expo-secure-store limit is 2048 bytes per key — tokens easily fit, but
 * a full User object often exceeds that limit, hence the split.
 */
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
      updateSession: (session) =>
        set((state) => ({
          session: state.session ? { ...state.session, ...session } : session,
        })),
      updateAccessToken: (accessToken) =>
        set((state) => ({
          session: state.session
            ? { ...state.session, accessToken }
            : { accessToken, refreshToken: "" },
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
      // Session tokens → SecureStore (small, safe to encrypt).
      // The user object is intentionally NOT persisted here to avoid the
      // expo-secure-store 2048-byte limit. It is re-populated on every
      // dashboard fetch via setUser() shortly after the app starts.
      storage: createJSONStorage(() => SecureStorage),
      partialize: (state) => ({
        session: state.session,
      }),
      // Version 2: migrates away from storing user in the same SecureStore key.
      version: 2,
    },
  ),
);

