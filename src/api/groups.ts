import { Group } from "../types/group";
import { Timetable } from "../types/timetable";
import apiClient from "./client";

export const groupsApi = {
  getAll: (eventId?: string) => 
    apiClient.get<Group[]>("/groups", { params: { event_id: eventId } }),
  getById: (id: string) => apiClient.get<Group>(`/groups/${id}`),
  create: (data: { name: string; description?: string; event_id?: string }) =>
    apiClient.post<Group>("/groups", data),
  addMember: (
    groupId: string,
    data: { user_id: string; role: "member" | "admin" },
  ) => apiClient.post(`/groups/${groupId}/members`, data),
  createSharedTimetable: (
    groupId: string,
    data: { event_id: string; name: string },
  ) => apiClient.post<Timetable>(`/groups/${groupId}/timetables`, data),
};
