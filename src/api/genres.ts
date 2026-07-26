import { Genre } from "../types/user";
import apiClient from "./client";

export const genreApi = {
  /**
   * Get all available genres.
   */
  getGenres: () => apiClient.get<Genre[]>("/genres"),
};
