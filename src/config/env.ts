import Constants from "expo-constants";

/**
 * Centralized environment configuration.
 *
 * Values are read from app.json > expo.extra at build time via expo-constants.
 * For local development, override via .env file with EXPO_PUBLIC_ prefix.
 *
 * IMPORTANT: All environment variables MUST be prefixed with EXPO_PUBLIC_
 * to be available in the client bundle. Expo strips non-prefixed vars.
 */
const getEnvVar = (name: string): string | undefined => {
  // Expo requires literal access for some build-time optimizations, 
  // but we provide a fallback for flexibility.
  if (name === "EXPO_PUBLIC_API_BASE_URL") return process.env.EXPO_PUBLIC_API_BASE_URL;
  if (name === "EXPO_PUBLIC_STORAGE_BASE_URL") return process.env.EXPO_PUBLIC_STORAGE_BASE_URL;

  if (typeof process !== "undefined" && process.env) {
    return (process.env as any)[name];
  }

  // Fallback to app.json extra
  const extra = Constants.expoConfig?.extra || {};
  if (extra[name]) return extra[name];

  const camelKey = name
    .replace("EXPO_PUBLIC_", "")
    .toLowerCase()
    .replace(/_([a-z])/g, (g) => g[1].toUpperCase());

  return extra[camelKey];
};

const ENV = {
  /**
   * The full base URL for the mobile API.
   * Example: "https://api.bangers.app/api/mobile"
   * Dev:     "http://192.168.x.x:8080/api/mobile"
   */
  API_BASE_URL:
    getEnvVar("EXPO_PUBLIC_API_BASE_URL") ||
    "http://localhost:8080/api/mobile",

  /**
   * The base URL for serving media files (images, banners, profile photos).
   * Should point to the same backend or a CDN in production.
   * Example: "https://cdn.bangers.app" or "http://192.168.x.x:8080"
   */
  STORAGE_BASE_URL:
    getEnvVar("EXPO_PUBLIC_STORAGE_BASE_URL") ||
    "http://localhost:8080",
} as const;

export default ENV;
