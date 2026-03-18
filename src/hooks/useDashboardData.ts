import { useCallback, useEffect, useRef, useState } from "react";
import { dashboardApi, DashboardData } from "../api/dashboard";
import { eventsRepository } from "../database/repositories/events.repository";
import { useSyncStore } from "../store/useSyncStore";
import { runDeltaSync } from "../sync/deltaSync";
import { useAuthStore } from "../store/useAuthStore";

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isSyncing = useSyncStore((state) => state.isSyncing);
  const fetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const fetchRemoteData = useCallback(async (signal?: AbortSignal) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      setError(null);
      const response = await dashboardApi.getDashboard({ signal });
      const dashboardData = response.data?.data;

      if (dashboardData) {
        setData(dashboardData);

        if (dashboardData.user) {
          useAuthStore.getState().setUser(dashboardData.user);
        }

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

        if (allEvents.length > 0) {
          if (!isSyncing) {
            await eventsRepository.batchUpsert(allEvents.filter(e => e && e.id));
          } else {
            console.log("Skipping dashboard DB update: background sync in progress");
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      setError(err);
      console.error("Failed to fetch remote dashboard data:", err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [isSyncing]);

  const refresh = useCallback(async () => {
    if (refreshing) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setRefreshing(true);
    try {
      await runDeltaSync(controller.signal);
      await fetchRemoteData(controller.signal);
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      console.error("Manual refresh failed:", err);
    } finally {
      setRefreshing(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [refreshing, fetchRemoteData]);

  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    loadLocalData().then(() => {
      fetchRemoteData(controller.signal);
    });

    return () => {
      controller.abort();
    };
  }, [loadLocalData, fetchRemoteData]);

  useEffect(() => {
    if (!isSyncing) {
      loadLocalData();
    }
  }, [isSyncing, loadLocalData]);

  return { data, loading, refreshing, error, refresh };
};
