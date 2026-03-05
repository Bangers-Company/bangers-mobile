import { useCallback, useEffect, useState } from "react";
import { userApi } from "../api/user";
import { favoritesRepository } from "../database/repositories/favorites.repository";
import { useAuthStore } from "../store/useAuthStore";
import { Event } from "../types/event";
import { UserStats } from "../types/user";

export function useProfile() {
  const { setAuth, accessToken, refreshToken, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [localStats, setLocalStats] = useState<UserStats | null>(null);
  const [attendingEvents, setAttendingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);

  const fetchProfile = useCallback(async () => {
    if (!accessToken || !refreshToken) return;

    setLoading(true);
    try {
      const response = await userApi.getMe();
      const userData = (response as any).data.data;

      if (!userData) {
        throw new Error("User data not found in response");
      }

      // Fetch local favorites
      const favoriteIds = await favoritesRepository.getAll();

      const stats: UserStats = {
        attended_count: userData.past_events?.length || 0,
        favorites_count: favoriteIds.length,
        vibe_score:
          (userData.past_events?.length || 0) * 10 + favoriteIds.length * 2,
      };

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
    loading,
    error,
    refreshProfile: fetchProfile,
  };
}
