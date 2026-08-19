import axios, { isCancel } from "axios";
import ENV from "../config/env";
import { useAuthStore } from "../store/useAuthStore";
import { AuthResponse } from "../types/user";
import { logger } from "../utils/logger";

const rawBaseUrl = (ENV.API_BASE_URL || "").replace(/\/+$/, "");
const baseURL = rawBaseUrl.endsWith("/v1") ? rawBaseUrl : `${rawBaseUrl}/v1`;

const apiClient = axios.create({
  baseURL,
  timeout: 10000, // 10s timeout to prevent hanging requests
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Request interceptor to add the bearer token
apiClient.interceptors.request.use(
  async (config) => {
    const session = useAuthStore.getState().session;
    if (session?.accessToken) {
      if (typeof (config.headers as any).set === "function") {
        (config.headers as any).set("Authorization", `Bearer ${session.accessToken}`);
      } else {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Shared promise for concurrent refresh requests
let refreshPromise: Promise<string> | null = null;

export const resetRefreshPromise = () => {
  refreshPromise = null;
};



// Response interceptor to handle token refresh and data unwrapping.
/**
 * NOTE: This automatically unwraps Laravel's { data: [...] } wrapper.
 * So hooks/stores should NOT manually access .data.data.
 */
apiClient.interceptors.response.use(
  (response) => {
    // Automatically unwrap Laravel's "data" wrapper while preserving metadata like sync_timestamp, meta, links
    if (response.data && typeof response.data === "object" && Object.prototype.hasOwnProperty.call(response.data, "data")) {
      const { data, ...metadata } = response.data;
      if (Array.isArray(data)) {
        Object.assign(data, metadata);
        return {
          ...response,
          data,
        };
      }
      if (data && typeof data === "object") {
        return {
          ...response,
          data: { ...metadata, ...data },
        };
      }
      return {
        ...response,
        data,
      };
    }
    return response;
  },
  async (error) => {
    // If the request was canceled or is 404 (expected missing item), don't log as system error
    if (isCancel(error)) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 404) {
      logger.error("API Error:", {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
      });
    }

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Do not trigger session refresh or recursive logout for device token deletion
      if (originalRequest.url?.includes("/user/device-tokens") || !useAuthStore.getState().session) {
        return Promise.reject(error);
      }

      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const session = useAuthStore.getState().session;
            if (!session?.refreshToken) {
              throw new Error("No refresh token available");
            }

            const response = await axios.post<AuthResponse>(
              `${API_BASE_URL}/auth/refresh`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${session.refreshToken}`,
                },
              },
            );

            const { accessToken, refreshToken } = response.data;
            useAuthStore.getState().updateSession({ accessToken, refreshToken });
            return accessToken;
          })().finally(() => {
            refreshPromise = null;
          });
        }

        const accessToken = await refreshPromise;
        if (originalRequest.headers && typeof (originalRequest.headers as any).set === "function") {
          (originalRequest.headers as any).set("Authorization", `Bearer ${accessToken}`);
        } else {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
