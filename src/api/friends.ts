import { User } from "../types/user";
import apiClient from "./client";

export interface Friendship {
  id: string;
  status: "pending" | "accepted" | "declined";
  requester_id: string;
  user1: Partial<User>;
  user2: Partial<User>;
  created_at: string;
  updated_at: string;
}

export const friendsApi = {
  getFriends: () => apiClient.get<Friendship[]>("/friends"),
  getRequests: () => apiClient.get<Friendship[]>("/friends/requests"),
  sendRequest: (userId: string) => apiClient.post(`/friends/${userId}`),
  acceptRequest: (userId: string) => apiClient.put(`/friends/${userId}/accept`),
  removeFriend: (userId: string) => apiClient.delete(`/friends/${userId}`),
};
