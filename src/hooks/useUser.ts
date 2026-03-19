import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/user';

export const useUser = (id: string | undefined) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await userApi.getUserById(id);
      return res.data;
    },
    enabled: !!id,
  });
};
