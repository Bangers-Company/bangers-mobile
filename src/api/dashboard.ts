import { Event } from "../types/event";
import { User } from "../types/user";
import apiClient from "./client";

export interface DashboardData {
  user?: User;
  attending_events: { data: Event[] } | Event[];
  upcoming_events: { data: Event[] } | Event[];
  past_events?: { data: Event[] } | Event[];
  suggested_events?: { data: Event[] } | Event[];
  friends_events?: { data: Event[] } | Event[];
  friends_count?: number;
  sync_timestamp: string;
}

export const dashboardApi = {
  getDashboard: () => apiClient.get<{ data: DashboardData }>("/dashboard"),
  getSuggestedEvents: () =>
    apiClient.get<{ data: Event[] }>("/events/suggested"),
};
