import { useQuery } from '@tanstack/react-query';
import { friendsApi } from '../api/friends';
import { useAuthStore } from '../store/useAuthStore';

export const useFriends = (userId: string | undefined) => {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['friends', userId],
    queryFn: async () => {
      if (!userId || !user) return [];
      const res = userId === 'me' 
        ? await friendsApi.getFriends() 
        : await friendsApi.getUserFriends(userId);
      return res.data || [];
    },
    enabled: !!userId && !!user,
  });
};

export const useFriendRequests = () => {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['friend-requests'],
    queryFn: async () => {
      if (!user) return [];
      const res = await friendsApi.getRequests();
      return res.data || [];
    },
    enabled: !!user,
  });
};
