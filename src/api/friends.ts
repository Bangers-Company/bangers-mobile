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
  getFriends: () => apiClient.get<{ data: User[] }>("/friends"),
  getUserFriends: (userId: string) => apiClient.get<{ data: User[] }>(`/friends/${userId}/friends`),
  getRequests: () => apiClient.get<{ data: Friendship[] }>("/friends/requests"),
  sendRequest: (userId: string) => apiClient.post<{ data: Friendship }>(`/friends/${userId}`),
  acceptRequest: (userId: string) => apiClient.put<{ data: Friendship }>(`/friends/${userId}/accept`),
  rejectRequest: (userId: string) => apiClient.put(`/friends/${userId}/reject`),
  removeFriend: (userId: string) => apiClient.delete(`/friends/${userId}`),
};
