import { AuthResponse, User } from "../types/user";
import apiClient from "./client";

export interface LoginData {
  email: string;
  password?: string;
  token?: string; // For social login or similar
}

export interface RegisterData extends Partial<User> {
  email: string;
  password?: string;
  username: string;
}

export const authApi = {
  register: (data: RegisterData) => apiClient.post<AuthResponse>("/auth/register", data),
  login: (data: LoginData) => apiClient.post<AuthResponse>("/auth/login", data),
  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>("/auth/refresh", {
      refresh_token: refreshToken,
    }),
  logout: () => apiClient.post("/auth/logout"),
};
