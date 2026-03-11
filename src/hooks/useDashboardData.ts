import { useCallback, useEffect, useRef, useState } from "react";
import { dashboardApi, DashboardData } from "../api/dashboard";
import { eventsRepository } from "../database/repositories/events.repository";
import { useSyncStore } from "../store/useSyncStore";
import { runDeltaSync } from "../sync/deltaSync";
import { useAuthStore } from "../store/useAuthStore";
import { useEventStore } from "../store/useEventStore";

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isSyncing = useSyncStore((state) => state.isSyncing);
  const fetchingRef = useRef(false);

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
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      setError(null);
      const response = await dashboardApi.getDashboard();
      const dashboardData = response.data?.data;

      if (dashboardData) {
        setData(dashboardData);

        // 1. Update User Profile in Auth Store
        if (dashboardData.user) {
          useAuthStore.getState().setUser(dashboardData.user);
        }

        // 2. Collect all events for batch processing
        const allEventLists = [
          dashboardData.attending_events,
          dashboardData.upcoming_events,
          dashboardData.past_events,
          dashboardData.suggested_events,
          dashboardData.friends_events
        ];

        const allEvents: any[] = [];
        allEventLists.forEach(list => {
          if (!list) return;
          const items = Array.isArray(list) ? list : (list as any).data || [];
          allEvents.push(...items);
        });

        // 3. Upsert to local DB for offline access
        for (const event of allEvents) {
          if (event && typeof event === "object" && event.id) {
            await eventsRepository.upsert(event);
          }
        }

        // 4. Cache in global Event Store
        useEventStore.getState().setEventsData(allEvents);
      }
    } catch (err: any) {
      setError(err);
      console.error("Failed to fetch remote dashboard data:", err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
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
