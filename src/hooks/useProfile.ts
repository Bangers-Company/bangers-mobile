import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/user';
import { friendsApi } from '../api/friends';
import { useAuthStore } from '../store/useAuthStore';
import { UserStats, User } from '../types/user';
import { usersRepository } from '../database/repositories/users.repository';

export const useProfile = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const { accessToken } = useAuthStore();

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      // 1. Try to load from API
      try {
        const [response, friendsRes] = await Promise.all([
          userApi.getMe(),
          friendsApi.getFriends()
        ]);
        
        const userData = response.data;
        const friendsResData = friendsRes?.data || [];

        if (!userData) {
          throw new Error("User data not found in response");
        }

        const attending = userData.upcoming_events || [];
        const past = userData.past_events || [];
        
        const friendsCount = userData.friends_count ?? friendsResData.length;
        
        const stats: UserStats = {
          upcoming_count: attending.length,
          past_count: past.length,
        };
        
        const profile: User = { 
          ...userData, 
          stats, 
          friends_count: friendsCount,
          attendingEvents: attending,
          pastEvents: past
        };

        // Sync with SQLite for offline
        await usersRepository.upsertMe(profile);
        
        // Sync with Zustand auth store
        setUser(profile);
        
        return profile;
      } catch (error) {
        // 2. Fallback to local DB if API fails
        const localUser = await usersRepository.getMe();
        if (localUser) return localUser;
        throw error;
      }
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
    // Add initialData from local DB for instant UI
    initialData: undefined, // We could load this synchronously if we had a sync cache
  });
};
