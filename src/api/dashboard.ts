import { Event } from "../types/event";
import apiClient from "./client";

export interface DashboardData {
  attending_events: Event[];
  upcoming_events: Event[];
  sync_timestamp: string;
}

export const dashboardApi = {
  getDashboard: () => apiClient.get<{ data: DashboardData }>("/dashboard"),
  getSuggestedEvents: () =>
    apiClient.get<{ data: Event[] }>("/events/suggested"),
};
