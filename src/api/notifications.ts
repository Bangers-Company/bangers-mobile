import apiClient from "./client";
import { AppNotification, NotificationsResponse } from "../types/notification";

export const registerDeviceToken = async (token: string, deviceType: "ios" | "android" | "web") => {
  const response = await apiClient.post("/user/device-tokens", {
    token,
    device_type: deviceType,
  });
  return response.data;
};

export const unregisterDeviceToken = async (token: string) => {
  const response = await apiClient.delete("/user/device-tokens", {
    data: { token },
  });
  return response.data;
};

export const getNotifications = async (page = 1): Promise<NotificationsResponse> => {
  const response = await apiClient.get("/notifications", {
    params: { page },
  });
  return response.data as NotificationsResponse;
};

export const markNotificationAsRead = async (id: string): Promise<AppNotification> => {
  const response = await apiClient.patch(`/notifications/${id}/read`);
  return response.data as AppNotification;
};

export const markAllNotificationsAsRead = async (): Promise<{ message: string }> => {
  const response = await apiClient.post("/notifications/read-all");
  return response.data as { message: string };
};
