import { AxiosRequestConfig } from "axios";
import { Event } from "../types/event";
import { User } from "../types/user";
import apiClient from "./client";

export interface DashboardData {
  user?: User;
  attending_events: Event[];
  upcoming_events: Event[];
  past_events?: Event[];
  suggested_events?: Event[];
  friends_events?: Event[];
  friends_count?: number;
  sync_timestamp: string;
}

export const dashboardApi = {
  getDashboard: (config?: AxiosRequestConfig) => apiClient.get<DashboardData>("/dashboard", config),
  getSuggestedEvents: (config?: AxiosRequestConfig) =>
    apiClient.get<Event[]>("/events/suggested", config),
};
