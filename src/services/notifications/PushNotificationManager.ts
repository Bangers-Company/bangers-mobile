import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { router } from "expo-router";
import { registerDeviceToken, unregisterDeviceToken } from "../../api/notifications";
import { registerLogoutCallback } from "../../store/useAuthStore";
import { logger } from "../../utils/logger";

// Configure foreground notification banner behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let currentFcmToken: string | null = null;
let lastRegisteredToken: string | null = null;
let isRegisteringToken: string | null = null;
let notificationReceivedSubscription: Notifications.Subscription | null = null;
let responseSubscription: Notifications.Subscription | null = null;
let tokenSubscription: Notifications.Subscription | null = null;

export const PushNotificationManager = {
  /**
   * Request notification permissions and register FCM device token with Laravel backend.
   */
  async registerToken(): Promise<string | null> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        logger.info("[PushNotificationManager] Notification permissions not granted");
        return null;
      }

      // Configure Android channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#a60df2",
        });
      }

      // Retrieve device push token (try native FCM token, fallback to Expo push token if needed)
      let token: string | null = null;
      try {
        const tokenData = await Notifications.getDevicePushTokenAsync();
        token = tokenData?.data || null;
      } catch (e) {
        logger.warn("[PushNotificationManager] getDevicePushTokenAsync failed, trying getExpoPushTokenAsync", e);
      }

      if (!token) {
        try {
          const expoTokenData = await Notifications.getExpoPushTokenAsync();
          token = expoTokenData?.data || null;
        } catch (e) {
          logger.error("[PushNotificationManager] getExpoPushTokenAsync also failed", e);
        }
      }

      if (!token) {
        logger.warn("[PushNotificationManager] Device push token empty");
        return null;
      }

      currentFcmToken = token;

      // Synchronously guard against duplicate or in-flight requests for the same token
      if (token !== lastRegisteredToken && isRegisteringToken !== token) {
        isRegisteringToken = token;
        try {
          const deviceType = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
          await registerDeviceToken(token, deviceType);
          lastRegisteredToken = token;
          logger.info("[PushNotificationManager] FCM device token registered successfully");
        } finally {
          isRegisteringToken = null;
        }
      }

      return token;
    } catch (error) {
      logger.error("[PushNotificationManager] Failed to register device push token:", error);
      return null;
    }
  },

  /**
   * Listen to push token refresh, foreground notification arrival, and notification tap events.
   */
  attachListeners(onNotificationReceived?: () => void) {
    this.removeListeners();

    // Token refresh listener (only registers if token changes and not in-flight)
    tokenSubscription = Notifications.addPushTokenListener(async (tokenData) => {
      if (tokenData?.data && tokenData.data !== lastRegisteredToken && isRegisteringToken !== tokenData.data) {
        const newToken = tokenData.data;
        currentFcmToken = newToken;
        isRegisteringToken = newToken;
        try {
          const deviceType = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
          await registerDeviceToken(newToken, deviceType);
          lastRegisteredToken = newToken;
        } catch (err) {
          logger.error("[PushNotificationManager] Failed to update refreshed FCM token:", err);
        } finally {
          isRegisteringToken = null;
        }
      }
    });

    // Foreground notification arrival handler
    notificationReceivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      logger.info("[PushNotificationManager] Foreground notification received:", notification.request.content.data);
      if (onNotificationReceived) {
        onNotificationReceived();
      }
    });

    // Tap on notification deep-link handler
    responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      logger.info("[PushNotificationManager] Notification tapped:", data);

      if (onNotificationReceived) {
        onNotificationReceived();
      }

      if (!data) return;

      const type = data.type;
      if (type === "FRIEND_REQUEST") {
        router.push("/notifications" as any);
      } else if (type === "FRIEND_REQUEST_ACCEPTED" && data.acceptor_id) {
        router.push(`/user/${data.acceptor_id}` as any);
      } else if ((type === "GROUP_INVITATION" || type === "GROUP_INVITATION_ACCEPTED") && data.group_id) {
        router.push(`/notifications` as any);
      }
    });

    // Cold-start notification tap handler (when app was opened from closed state via push tap)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        if (onNotificationReceived) {
          onNotificationReceived();
        }
        const data = response.notification.request.content.data;
        if (!data) return;
        const type = data.type;
        if (type === "FRIEND_REQUEST") {
          router.push("/notifications" as any);
        } else if (type === "FRIEND_REQUEST_ACCEPTED" && data.acceptor_id) {
          router.push(`/user/${data.acceptor_id}` as any);
        } else if ((type === "GROUP_INVITATION" || type === "GROUP_INVITATION_ACCEPTED") && data.group_id) {
          router.push(`/notifications` as any);
        }
      }
    });
  },

  /**
   * Clean up subscriptions.
   */
  removeListeners() {
    if (tokenSubscription) {
      tokenSubscription.remove();
      tokenSubscription = null;
    }
    if (notificationReceivedSubscription) {
      notificationReceivedSubscription.remove();
      notificationReceivedSubscription = null;
    }
    if (responseSubscription) {
      responseSubscription.remove();
      responseSubscription = null;
    }
  },

  /**
   * Unregister FCM token on logout.
   */
  async unregisterToken(accessTokenOverride?: string) {
    const tokenToUnregister = currentFcmToken;
    const { useAuthStore } = await import("../../store/useAuthStore");
    const accessToken = accessTokenOverride || useAuthStore.getState().session?.accessToken;

    currentFcmToken = null;
    lastRegisteredToken = null;
    isRegisteringToken = null;

    if (tokenToUnregister) {
      try {
        await unregisterDeviceToken(tokenToUnregister, accessToken);
        logger.info("[PushNotificationManager] Unregistered FCM token on logout");
      } catch (error) {
        logger.warn("[PushNotificationManager] Failed to unregister token on logout:", error);
      }
    }
  },
};

// Register logout callback to unregister FCM token
registerLogoutCallback(async () => {
  await PushNotificationManager.unregisterToken();
  PushNotificationManager.removeListeners();
});
