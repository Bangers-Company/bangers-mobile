import { User } from "../types/user";
import apiClient from "./client";

export const userApi = {
  getMe: () => apiClient.get<User>("/users/me"),
  updateProfile: (id: string, data: Partial<User>) =>
    apiClient.put<User>(`/users/${id}`, data),
};
