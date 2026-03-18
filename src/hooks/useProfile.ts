import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/user';
import { friendsApi } from '../api/friends';
import { useAuthStore } from '../store/useAuthStore';
import { UserStats } from '../types/user';

export const useProfile = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const [response, friendsRes] = await Promise.all([
        userApi.getMe(),
        friendsApi.getFriends()
      ]);
      
      const userData = (response as any).data.data || (response as any).data;
      const friendsResData = friendsRes?.data?.data || friendsRes?.data || [];

      if (!userData) {
        throw new Error("User data not found in response");
      }

      const attending = userData.upcoming_events?.data || userData.upcoming_events || [];
      const past = userData.past_events?.data || userData.past_events || [];
      
      const friendsCount = userData.friends_count ?? friendsResData.length;
      
      const stats: UserStats = {
        upcoming_count: attending.length,
        past_count: past.length,
      };
      
      const profile = { 
        ...userData, 
        stats, 
        friends_count: friendsCount,
        attendingEvents: attending,
        pastEvents: past
      };

      // Sync with Zustand auth store
      setUser(profile);
      
      return profile;
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  });
};
