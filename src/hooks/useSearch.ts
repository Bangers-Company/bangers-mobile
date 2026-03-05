import { useQuery } from "@tanstack/react-query";
import { searchApi } from "../api/search";

export const useSearch = (query: string) => {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => searchApi.search(query),
    enabled: query.length >= 2,
    placeholderData: (previousData) => previousData,
  });
};
