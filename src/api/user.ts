import { AxiosRequestConfig } from "axios";
import { User } from "../types/user";
import apiClient from "./client";

export const userApi = {
  getMe: (config?: AxiosRequestConfig) => 
    apiClient.get<User>("/users/me", config),
  getUserById: (id: string, config?: AxiosRequestConfig) => 
    apiClient.get<{ data: User }>(`/users/${id}`, config),
  updateProfile: (id: string, data: Partial<User>, config?: AxiosRequestConfig) =>
    apiClient.put<User>(`/users/${id}`, data, config),
};
