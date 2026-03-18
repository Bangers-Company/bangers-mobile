import { AxiosRequestConfig } from "axios";
import { Timetable } from "../types/timetable";
import apiClient from "./client";

export const timetablesApi = {
  getOfficial: (eventId: string, config?: AxiosRequestConfig) =>
    apiClient.get(`/events/${eventId}/timetable`, config),
  toggleOfficialAttend: (eventId: string, entryId: string) =>
    apiClient.post(`/events/${eventId}/timetable/entries/${entryId}/toggle-attend`),
  getGroups: (config?: AxiosRequestConfig) => apiClient.get("/groups", config),
  getGroupTimetables: (groupId: string, config?: AxiosRequestConfig) => 
    apiClient.get<Timetable[]>(`/groups/${groupId}/timetables`, config),
  deleteGroup: (id: string) => apiClient.delete(`/groups/${id}`),
  createGroupTimetable: (groupId: string, data: { event_id: string; name: string }) =>
    apiClient.post<Timetable>(`/groups/${groupId}/timetables`, data),
  toggleAttend: (id: string, entryId: string, isGroup = false, groupId?: string, eventId?: string) => {
    const url = isGroup 
      ? `/groups/${groupId}/timetables/${id}/entries/${entryId}/toggle-attend`
      : `/events/${eventId}/timetable/entries/${entryId}/toggle-attend`;
    return apiClient.post<{ is_attending: boolean; count?: number }>(url);
  },
  getAttendance: (groupId: string, timetableId: string, entryId: string) =>
    apiClient.get<any[]>(`/groups/${groupId}/timetables/${timetableId}/entries/${entryId}/attendance`),
  createGroup: (data: { name: string; description?: string; user_ids?: string[] }) =>
    apiClient.post("/groups", data),
  acceptInvitation: (groupId: string) =>
    apiClient.post(`/groups/${groupId}/accept`),
  rejectInvitation: (groupId: string) =>
    apiClient.post(`/groups/${groupId}/reject`),
  getInvitations: () => apiClient.get("/groups?status=pending"), // We'll need to filter in backend or frontend
};
