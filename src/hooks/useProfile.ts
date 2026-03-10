import { useCallback, useEffect, useState } from "react";
import { userApi } from "../api/user";
import { favoritesRepository } from "../database/repositories/favorites.repository";
import { useAuthStore } from "../store/useAuthStore";
import { Event } from "../types/event";
import { UserStats } from "../types/user";
import { friendsApi } from "../api/friends";

export function useProfile() {
  const { setAuth, accessToken, refreshToken, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [localStats, setLocalStats] = useState<UserStats | null>(null);
  const [attendingEvents, setAttendingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [friendsCount, setFriendsCount] = useState<number>(0);

  const fetchProfile = useCallback(async () => {
    if (!accessToken || !refreshToken) return;

    setLoading(true);
    try {
      const [response, friendsRes] = await Promise.all([
        userApi.getMe(),
        friendsApi.getFriends()
      ]);
      const userData = (response as any).data.data;
      const friendsData = friendsRes?.data?.data || [];

      if (!userData) {
        throw new Error("User data not found in response");
      }
      setFriendsCount(friendsData.length);

      const stats: UserStats = {
        upcoming_count: userData.upcoming_events?.length || 0,
        past_count: userData.past_events?.length || 0,
      };

      console.log(userData)

      setAttendingEvents(
        userData.upcoming_events?.data || userData.upcoming_events || [],
      );
      setPastEvents(userData.past_events?.data || userData.past_events || []);
      setLocalStats(stats);
      setAuth(accessToken, refreshToken, { ...userData, stats });
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, refreshToken, setAuth]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    user: user ? { ...user, stats: localStats || user.stats } : null,
    attendingEvents,
    pastEvents,
    friendsCount,
    loading,
    error,
    refreshProfile: fetchProfile,
  };
}
