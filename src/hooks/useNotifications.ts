import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../api/notifications";
import { PushNotificationManager } from "../services/notifications/PushNotificationManager";
import { useAuthStore } from "../store/useAuthStore";
import { logger } from "../utils/logger";

import { AppState, AppStateStatus } from "react-native";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"];

/**
 * Fetch in-app notifications with pagination & unread count.
 */
export function useNotifications(page = 1) {
  const session = useAuthStore((state) => state.session);
  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, page],
    queryFn: () => getNotifications(page),
    enabled: !!session?.accessToken,
    staleTime: 1000 * 5, // 5 seconds
    refetchInterval: 10000, // Poll every 10s in foreground
  });
}

/**
 * Mark single notification as read.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
    onError: (err) => {
      logger.error("[useMarkNotificationRead] Failed to mark notification read:", err);
    },
  });
}

/**
 * Mark all notifications as read.
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
    onError: (err) => {
      logger.error("[useMarkAllNotificationsRead] Failed to mark all notifications read:", err);
    },
  });
}

/**
 * Hook to initialize Push Notifications lifecycle when authenticated.
 */
export function usePushNotifications() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.accessToken;

  useEffect(() => {
    if (!accessToken) return;

    // Comprehensive refresh for all real-time views across the app
    const refreshAllData = () => {
      logger.info("[usePushNotifications] Refreshing all real-time data queries");
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["friendship"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    };

    // Trigger an immediate refresh when authenticated hook mounts
    refreshAllData();

    // Register FCM device token with backend
    PushNotificationManager.registerToken();

    // Attach push listeners (triggers instant view refresh on push arrival or tap)
    PushNotificationManager.attachListeners(() => {
      refreshAllData();
    });

    // Invalidate queries when app returns to foreground from background/lockscreen
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        refreshAllData();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      PushNotificationManager.removeListeners();
      subscription.remove();
    };
  }, [accessToken, queryClient]);
}
