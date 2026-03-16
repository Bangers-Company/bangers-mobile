import { AxiosRequestConfig } from "axios";
import { Act } from "../types/act";
import { Artist } from "../types/artist";
import { Event, SyncResponse } from "../types/event";
import apiClient from "./client";

export const syncApi = {
  getEvents: (since?: string, config?: AxiosRequestConfig) =>
    apiClient.get<SyncResponse<Event>>("/sync/events", { 
      ...config,
      params: { ...config?.params, since } 
    }),
  getArtists: (since?: string, config?: AxiosRequestConfig) =>
    apiClient.get<SyncResponse<Artist>>("/sync/artists", { 
      ...config,
      params: { ...config?.params, since } 
    }),
  getActs: (since?: string, config?: AxiosRequestConfig) =>
    apiClient.get<SyncResponse<Act>>("/sync/acts", { 
      ...config,
      params: { ...config?.params, since } 
    }),
};
