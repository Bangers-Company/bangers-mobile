import { Timetable } from "../types/timetable";
import apiClient from "./client";

export const timetablesApi = {
  getOfficial: (eventId: string) =>
    apiClient.get(`/events/${eventId}/timetable`),
  getPersonal: (eventId: string) =>
    apiClient.get<Timetable>(`/personal-timetables/${eventId}`),
  createPersonal: (data: any) => apiClient.post("/personal-timetables", data),
  updateEntries: (id: string, entryIds: string[]) =>
    apiClient.put(`/personal-timetables/${id}/entries`, {
      entry_ids: entryIds,
    }),
};
