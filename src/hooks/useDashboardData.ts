import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { dashboardApi, DashboardData } from "../api/dashboard";
import { eventsRepository } from "../database/repositories/events.repository";
import { useSyncStore } from "../store/useSyncStore";
import { runDeltaSync } from "../sync/deltaSync";
import { useAuthStore } from "../store/useAuthStore";

export const useDashboardData = () => {
  const queryClient = useQueryClient();
  const isSyncing = useSyncStore((state) => state.isSyncing);

  const fetchDashboard = async ({ signal }: { signal?: AbortSignal }) => {
    try {
      const response = await dashboardApi.getDashboard({ signal });
      const dashboardData = response.data;

      if (dashboardData) {
        if (dashboardData.user) {
          useAuthStore.getState().setUser(dashboardData.user);
        }

        const sortEvents = (events: any[]) => 
          [...events].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

        if (dashboardData.attending_events) {
          dashboardData.attending_events = sortEvents(dashboardData.attending_events);
        }
        if (dashboardData.upcoming_events) {
          dashboardData.upcoming_events = sortEvents(dashboardData.upcoming_events);
        }

        const allEventLists = [
          dashboardData.attending_events,
          dashboardData.upcoming_events,
          dashboardData.past_events,
          dashboardData.suggested_events,
          dashboardData.friends_events
        ];

        const allEvents: import("../types/event").Event[] = [];
        allEventLists.forEach(list => {
          if (!list) return;
          allEvents.push(...list);
        });

        if (allEvents.length > 0) {
          if (!isSyncing) {
            await eventsRepository.batchUpsert(allEvents.filter(e => e && e.id));
          }
        }
        return dashboardData;
      }
      return null;
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') throw err;
      console.error("Failed to fetch remote dashboard data:", err);
      
      // Fallback to local data on error
      const [attendingEvents, allEvents] = await Promise.all([
        eventsRepository.getAttendingEvents(),
        eventsRepository.getAll(),
      ]);

      const sortEvents = (events: any[]) => 
          [...events].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

      const upcomingEvents = allEvents.filter(e => new Date(e.start_date) > new Date());

      return {
        attending_events: sortEvents(attendingEvents),
        upcoming_events: sortEvents(upcomingEvents),
        suggested_events: allEvents.slice(0, 10),
        sync_timestamp: new Date().toISOString(),
      } as DashboardData;
    }
  };

  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: ({ signal }) => fetchDashboard({ signal }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const refresh = useCallback(async () => {
    try {
      await runDeltaSync();
      await refetch();
    } catch (err) {
      console.error("Manual refresh failed:", err);
    }
  }, [refetch]);

  // If we are not syncing and we just finished a background sync, refetch
  useEffect(() => {
    if (!isSyncing) {
      refetch();
    }
  }, [isSyncing, refetch]);

  return { 
    data, 
    loading: isLoading, 
    refreshing: isRefetching, 
    error, 
    refresh 
  };
};

