import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/search';
import { searchSchema } from '../validation/schemas';
import { useDebounce } from './useDebounce';

export const useSearch = (query: string, entities: string[] = []) => {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ['search', debouncedQuery, entities],
    queryFn: async () => {
      // Validate input before sending to API
      const result = searchSchema.safeParse({ query: debouncedQuery, entities });
      if (!result.success || !debouncedQuery) {
        return { events: { data: [] }, artists: { data: [] }, acts: { data: [] }, users: { data: [] } };
      }

      const res = await searchApi.search(debouncedQuery, entities);
      return res.data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 60 * 1000,
  });
};
