import { Event } from "../types/event";
import apiClient from "./client";

export const eventsApi = {
  getById: (id: string) => apiClient.get<Event>(`/events/${id}`),
  getAttendees: (id: string) => apiClient.get(`/events/${id}/attendees`),
  getAttendance: (id: string) => apiClient.get(`/events/${id}/attendance`),
  updateAttendance: (id: string) => apiClient.put(`/events/${id}/attendance`),
  deleteAttendance: (id: string) =>
    apiClient.delete(`/events/${id}/attendance`),
};

export const searchApi = {
  search: (query: string) => apiClient.get("/search", { params: { query } }),
};

export const groupsApi = {
  getAll: () => apiClient.get("/groups"),
  getById: (id: string) => apiClient.get(`/groups/${id}`),
  create: (data: any) => apiClient.post("/groups", data),
  addMember: (groupId: string, data: any) =>
    apiClient.post(`/groups/${groupId}/members`, data),
};
