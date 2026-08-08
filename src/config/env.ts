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
  // Expo requires literal access for some build-time optimizations
  const processEnv = (process.env as any) || {};

  // Use a map for literal lookups to help bundlers
  const literalMap: Record<string, string | undefined> = {
    EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    EXPO_PUBLIC_STORAGE_BASE_URL: process.env.EXPO_PUBLIC_STORAGE_BASE_URL,
  };

  if (literalMap[name]) return literalMap[name];
  if (processEnv[name]) return processEnv[name];

  // Fallback to app.json extra
  const extra = Constants.expoConfig?.extra || {};
  if (extra[name]) return extra[name];

  const camelKey = name
    .replace("EXPO_PUBLIC_", "")
    .toLowerCase()
    .replace(/_([a-z])/g, (g) => g[1].toUpperCase());

  return extra[camelKey];
};

const validateUrl = (url: string, name: string) => {
  if (!url) return "";

  let finalUrl = url;
  if (__DEV__ && !finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
    console.warn(`[Environment Warning] ${name} is missing a protocol. Prepending http://`);
    finalUrl = `http://${finalUrl}`;
  }

  if (!__DEV__ && finalUrl.startsWith("http://")) {
    throw new Error(
      `SECURITY CRITICAL: Non-HTTPS URL detected for ${name} in production: ${finalUrl}`,
    );
  }
  if (
    __DEV__ &&
    finalUrl.startsWith("http://") &&
    !finalUrl.includes("localhost") &&
    !finalUrl.includes("127.0.0.1") &&
    !finalUrl.includes("10.0.2.2") && // Android Emulator loopback
    !finalUrl.includes("192.168.")
  ) {
    console.warn(
      `[Security Warning] Non-HTTPS external URL for ${name} in development: ${finalUrl}`,
    );
  }
  return finalUrl;
};

const getHostIp = () => {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).experienceUrl || "";
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      return ip;
    }
  }
  return "localhost";
};

const sanitizeDevUrl = (url: string) => {
  if (!url) return url;
  const hostIp = getHostIp();
  if (hostIp !== "localhost") {
    return url.replace("localhost", hostIp).replace("127.0.0.1", hostIp);
  }
  return url;
};

const rawApiUrl = sanitizeDevUrl(
  getEnvVar("EXPO_PUBLIC_API_BASE_URL") || "http://localhost:8080/api/mobile/v1",
);
const rawStorageUrl = sanitizeDevUrl(
  getEnvVar("EXPO_PUBLIC_STORAGE_BASE_URL") || "http://localhost:8080",
);

const ENV = {
  API_BASE_URL: validateUrl(rawApiUrl, "API_BASE_URL"),
  STORAGE_BASE_URL: validateUrl(rawStorageUrl, "STORAGE_BASE_URL"),
} as const;

export default ENV;

