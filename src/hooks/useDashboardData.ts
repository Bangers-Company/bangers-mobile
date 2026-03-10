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
      const [attendingEvents, allEvents] = await Promise.all([
        eventsRepository.getAttendingEvents(),
        eventsRepository.getAll(),
      ]);

      const sortedAttending = [...attendingEvents].sort(
        (a, b) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
      );

      const upcomingEvents = allEvents
        .filter((e) => new Date(e.start_date) > new Date())
        .sort(
          (a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
        );

      setData({
        attending_events: sortedAttending,
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
      const [dashboardRes, suggestedRes] = await Promise.all([
        dashboardApi.getDashboard(),
        dashboardApi.getSuggestedEvents(),
      ]);

      const dashboardData = dashboardRes.data?.data;
      const suggestedEvents = suggestedRes.data?.data || [];

      if (dashboardData) {
        setData({
          ...dashboardData,
          suggested_events: suggestedEvents,
        });

        // Upsert events to local DB for offline access
        const upcomingEventsRaw = dashboardData.upcoming_events;
        const upcomingEvents = Array.isArray(upcomingEventsRaw)
          ? upcomingEventsRaw
          : upcomingEventsRaw?.data || [];

        for (const event of upcomingEvents) {
          if (event && typeof event === "object") {
            await eventsRepository.upsert(event);
          }
        }
      }
    } catch (err: any) {
      setError(err);
      console.error("Failed to fetch remote dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      // Manual refresh pulls everything
      await runDeltaSync();
      await fetchRemoteData();
    } catch (err) {
      console.error("Manual refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, fetchRemoteData]);

  // Initial load
  useEffect(() => {
    loadLocalData().then(() => {
      fetchRemoteData();
    });
    // We only want this on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload local data when background sync finishes
  useEffect(() => {
    if (!isSyncing) {
      loadLocalData();
    }
  }, [isSyncing, loadLocalData]);

  return { data, loading, refreshing, error, refresh };
};
