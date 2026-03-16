import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { AuthResponse } from "../types/user";

const API_BASE_URL = "http://192.168.3.2:8080/api/mobile"; // Replace with actual API URL or env var

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
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Shared promise for concurrent refresh requests
let refreshPromise: Promise<string> | null = null;

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const refreshToken = useAuthStore.getState().refreshToken;
            if (!refreshToken) {
              throw new Error("No refresh token available");
            }

            const response = await axios.post<AuthResponse>(
              `${API_BASE_URL}/auth/refresh`,
              {
                refresh_token: refreshToken,
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
