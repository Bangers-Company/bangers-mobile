import { User } from "../types/user";
import apiClient from "./client";

export const userApi = {
  getMe: () => apiClient.get<User>("/users/me"),
  getUserById: (id: string) => apiClient.get<{ data: User }>(`/users/${id}`),
  updateProfile: (id: string, data: Partial<User>) =>
    apiClient.put<User>(`/users/${id}`, data),
};
