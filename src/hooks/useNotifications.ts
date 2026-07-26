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

export const NOTIFICATIONS_QUERY_KEY = ["notifications"];

/**
 * Fetch in-app notifications with pagination & unread count.
 */
export function useNotifications(page = 1) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, page],
    queryFn: () => getNotifications(page),
    staleTime: 1000 * 30, // 30 seconds
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

    // Register FCM device token with backend
    PushNotificationManager.registerToken();

    // Attach push listeners
    PushNotificationManager.attachListeners(() => {
      // Invalidate notifications query when push arrives or is tapped
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    });

    return () => {
      PushNotificationManager.removeListeners();
    };
  }, [accessToken, queryClient]);
}
