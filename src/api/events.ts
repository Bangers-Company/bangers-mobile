import { AxiosRequestConfig } from "axios";
import { Event } from "../types/event";
import apiClient from "./client";

export const eventsApi = {
  getById: (id: string, config?: AxiosRequestConfig) => 
    apiClient.get<Event>(`/events/${id}`, config),
  getAttendees: (id: string, config?: AxiosRequestConfig) => 
    apiClient.get(`/events/${id}/attendees`, config),
  getAttendance: (id: string, config?: AxiosRequestConfig) => 
    apiClient.get(`/events/${id}/attendance`, config),
  updateAttendance: (id: string, status: "going" | "interested", config?: AxiosRequestConfig) =>
    apiClient.put(`/events/${id}/attendance`, { status }, config),
  deleteAttendance: (id: string, config?: AxiosRequestConfig) =>
    apiClient.delete(`/events/${id}/attendance`, config),
};

export const searchApi = {
  search: (query: string, config?: AxiosRequestConfig) => 
    apiClient.get("/search", { ...config, params: { ...config?.params, query } }),
};

export const groupsApi = {
  getAll: () => apiClient.get("/groups"),
  getById: (id: string) => apiClient.get(`/groups/${id}`),
  create: (data: any) => apiClient.post("/groups", data),
  addMember: (groupId: string, data: any) =>
    apiClient.post(`/groups/${groupId}/members`, data),
};
