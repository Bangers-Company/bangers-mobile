import { useQuery } from '@tanstack/react-query';
import { friendsApi } from '../api/friends';

export const useFriends = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['friends', userId],
    queryFn: async () => {
      if (!userId) return [];
      const res = userId === 'me' 
        ? await friendsApi.getFriends() 
        : await friendsApi.getUserFriends(userId);
      return (res as any).data.data || res.data || [];
    },
    enabled: !!userId,
  });
};

export const useFriendRequests = () => {
  return useQuery({
    queryKey: ['friend-requests'],
    queryFn: async () => {
      const res = await friendsApi.getRequests();
      return res.data || [];
    },
  });
};
