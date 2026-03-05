import apiClient from "./client";

export const favoritesApi = {
  toggleFavorite: (entryId: string) => apiClient.post(`/favorites/${entryId}`),
  removeFavorite: (entryId: string) =>
    apiClient.delete(`/favorites/${entryId}`),
};
