import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { AuthResponse } from "../types/user";
import ENV from "../config/env";
import { logger } from "../utils/logger";

const API_BASE_URL = ENV.API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Shared promise for concurrent refresh requests
let refreshPromise: Promise<string> | null = null;


// Response interceptor to handle token refresh and data unwrapping.
/**
 * NOTE: This automatically unwraps Laravel's { data: [...] } wrapper.
 * So hooks/stores should NOT manually access .data.data.
 */
apiClient.interceptors.response.use(
  (response) => {
    // Automatically unwrap Laravel's "data" wrapper if it exists
    if (response.data && Object.prototype.hasOwnProperty.call(response.data, "data")) {
      return {
        ...response,
        data: response.data.data,
      };
    }
    return response;
  },
  async (error) => {
    logger.error("API Error:", { 
      url: error.config?.url,
      status: error.response?.status,
      message: error.message 
    });
    
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const session = useAuthStore.getState().session;
            if (!session?.refreshToken) {
              throw new Error("No refresh token available");
            }

            const response = await axios.post<AuthResponse>(
              `${API_BASE_URL}/auth/refresh`,
              {
                refresh_token: session.refreshToken,
              },
            );

            const { accessToken } = response.data;
            useAuthStore.getState().updateAccessToken(accessToken);
            return accessToken;
          })().finally(() => {
            refreshPromise = null;
          });
        }

        const accessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
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
