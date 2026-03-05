import { Act } from "../types/act";
import { Artist } from "../types/artist";
import { Event, SyncResponse } from "../types/event";
import apiClient from "./client";

export const syncApi = {
  getEvents: (since?: string) =>
    apiClient.get<SyncResponse<Event>>("/sync/events", { params: { since } }),
  getArtists: (since?: string) =>
    apiClient.get<SyncResponse<Artist>>("/sync/artists", { params: { since } }),
  getActs: (since?: string) =>
    apiClient.get<SyncResponse<Act>>("/sync/acts", { params: { since } }),
};
