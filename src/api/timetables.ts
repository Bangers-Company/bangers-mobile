import { Timetable } from "../types/timetable";
import apiClient from "./client";

export const timetablesApi = {
  getOfficial: (eventId: string) =>
    apiClient.get(`/events/${eventId}/timetable`),
  getPersonal: (eventId: string) =>
    apiClient.get<Timetable>(`/personal-timetables/${eventId}`),
  createPersonal: (data: { event_id: string; name: string }) => 
    apiClient.post<Timetable>("/personal-timetables", data),
  getGroups: () => apiClient.get("/groups"),
  getGroupTimetables: (groupId: string) => 
    apiClient.get<Timetable[]>(`/groups/${groupId}/timetables`),
  createGroupTimetable: (groupId: string, data: { event_id: string; name: string }) =>
    apiClient.post<Timetable>(`/groups/${groupId}/timetables`, data),
  updateEntries: (id: string, entryIds: string[], isGroup = false, groupId?: string) => {
    const url = isGroup 
      ? `/groups/${groupId}/timetables/${id}/entries`
      : `/personal-timetables/${id}/entries`;
    return apiClient.put<Timetable>(url, { entry_ids: entryIds });
  },
};
