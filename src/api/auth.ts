import { AuthResponse } from "../types/user";
import apiClient from "./client";

export const authApi = {
  register: (data: any) => apiClient.post<AuthResponse>("/auth/register", data),
  login: (data: any) => apiClient.post<AuthResponse>("/auth/login", data),
  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>("/auth/refresh", {
      refresh_token: refreshToken,
    }),
  logout: () => apiClient.post("/auth/logout"),
};
