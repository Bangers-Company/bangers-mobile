import { AxiosRequestConfig } from "axios";
import { User } from "../types/user";
import apiClient from "./client";

export interface Friendship {
  id: string;
  status: "pending" | "accepted" | "rejected";
  requested_by: string;
  user_id_1: string;
  user_id_2: string;
  user1?: User;
  user2?: User;
  requester?: User;
  created_at: string;
  updated_at: string;
}

export const friendsApi = {
  getFriends: (config?: AxiosRequestConfig) => 
    apiClient.get<User[]>("/friends", config),
  getUserFriends: (userId: string, config?: AxiosRequestConfig) => 
    apiClient.get<User[]>(`/friends/${userId}/friends`, config),
  getRequests: (config?: AxiosRequestConfig) => 
    apiClient.get<Friendship[]>("/friends/requests", config),
  sendRequest: (userId: string, config?: AxiosRequestConfig) => 
    apiClient.post<Friendship>(`/friends/${userId}`, config),
  acceptRequest: (userId: string, config?: AxiosRequestConfig) => 
    apiClient.put<Friendship>(`/friends/${userId}/accept`, config),
  rejectRequest: (userId: string, config?: AxiosRequestConfig) => 
    apiClient.put(`/friends/${userId}/reject`, config),
  removeFriend: (userId: string, config?: AxiosRequestConfig) => 
    apiClient.delete(`/friends/${userId}`, config),
};
