import { Act } from "../types/act";
import { Artist } from "../types/artist";
import { Event } from "../types/event";
import apiClient from "./client";

export interface SearchResponse {
  events: {
    data: Event[];
    meta: any;
    links: any;
  };
  artists: {
    data: Artist[];
    meta: any;
    links: any;
  };
  acts: {
    data: Act[];
    meta: any;
    links: any;
  };
}

export const searchApi = {
  search: (query: string) =>
    apiClient.get<SearchResponse>("/search", { params: { query } }),
};
