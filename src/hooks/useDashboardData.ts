import { useCallback, useEffect, useState } from "react";
import { dashboardApi, DashboardData } from "../api/dashboard";
import { eventsRepository } from "../database/repositories/events.repository";
import { useSyncStore } from "../store/useSyncStore";
import { runDeltaSync } from "../sync/deltaSync";

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isSyncing = useSyncStore((state) => state.isSyncing);

  const loadLocalData = useCallback(async () => {
    try {
      const attendingEvents = await eventsRepository.getAll(); // Simplified for now
      // In a real scenario, we'd filter for attending/upcoming
      const upcomingEvents = attendingEvents.filter(
        (e) => new Date(e.start_date) > new Date(),
      );

      setData({
        attending_events: attendingEvents.filter((_, index) => index % 2 === 0), // Mock attendance for now
        upcoming_events: upcomingEvents,
        sync_timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to load local dashboard data:", err);
    }
  }, []);

  const fetchRemoteData = useCallback(async () => {
    try {
      setError(null);
      const response = await dashboardApi.getDashboard();
      setData(response.data.data);

      // Upsert events to local DB for offline access
      const upcomingEventsRaw = response.data.data.upcoming_events;
      const upcomingEvents = Array.isArray(upcomingEventsRaw)
        ? upcomingEventsRaw
        : upcomingEventsRaw?.data || [];
      for (const event of upcomingEvents) {
        await eventsRepository.upsert(event);
      }
    } catch (err: any) {
      setError(err);
      console.error("Failed to fetch remote dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await runDeltaSync();
      await fetchRemoteData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchRemoteData]);

  useEffect(() => {
    // 1. Load local data immediately for fast UX
    loadLocalData().then(() => {
      // 2. Fetch remote data if not syncing
      if (!isSyncing) {
        fetchRemoteData();
      }
    });
  }, [loadLocalData, fetchRemoteData, isSyncing]);

  return { data, loading, refreshing, error, refresh };
};
