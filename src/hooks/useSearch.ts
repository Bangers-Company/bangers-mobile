import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/events';

export const useSearch = (query: string, entities: string[] = []) => {
  return useQuery({
    queryKey: ['search', query, entities],
    queryFn: async () => {
      if (!query) return { events: { data: [] }, artists: { data: [] }, acts: { data: [] }, users: { data: [] } };
      const res = await searchApi.search(query, { params: { entities: entities.join(',') } });
      return (res.data as any).data || res.data;
    },
    enabled: query.length > 0,
    staleTime: 60 * 1000,
  });
};
