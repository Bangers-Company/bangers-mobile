import { Act } from "../types/act";
import { Artist } from "../types/artist";
import { Event } from "../types/event";
import { User } from "../types/user";
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
  users: {
    data: User[];
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
    entities: string[] = ["events", "artists", "acts", "users"],
    perPage: number = 20,
  ) =>
    apiClient.get<SearchData>("/search", {
      params: {
        query,
        entities,
        per_page: perPage,
      },
    }),
};
