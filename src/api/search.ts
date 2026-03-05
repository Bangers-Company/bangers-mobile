import { Act } from "../types/act";
import { Artist } from "../types/artist";
import { Event } from "../types/event";
import apiClient from "./client";

export interface SearchData {
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

export interface SearchResponse {
  data: SearchData;
}

export const searchApi = {
  search: (
    query: string,
    entities: string[] = ["events", "artists", "acts"],
    perPage: number = 20,
  ) =>
    apiClient.get<SearchResponse>("/search", {
      params: {
        query,
        entities,
        per_page: perPage,
      },
    }),
};
