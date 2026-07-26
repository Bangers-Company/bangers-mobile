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

      // Retrieve device push token (returns FCM token on Android/iOS)
      const tokenData = await Notifications.getDevicePushTokenAsync();
      const token = tokenData.data;

      if (!token) {
        logger.warn("[PushNotificationManager] Device push token empty");
        return null;
      }

      currentFcmToken = token;

      const deviceType = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
      await registerDeviceToken(token, deviceType);

      logger.info("[PushNotificationManager] FCM device token registered successfully");
      return token;
    } catch (error) {
      logger.error("[PushNotificationManager] Failed to register device push token:", error);
      return null;
    }
  },

  /**
   * Listen to push token refresh and notification tap events.
   */
  attachListeners(onNotificationReceived?: () => void) {
    this.removeListeners();

    // Token refresh listener
    tokenSubscription = Notifications.addPushTokenListener(async (tokenData) => {
      if (tokenData?.data) {
        currentFcmToken = tokenData.data;
        const deviceType = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
        await registerDeviceToken(tokenData.data, deviceType).catch((err) =>
          logger.error("[PushNotificationManager] Failed to update refreshed FCM token:", err)
        );
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
  },

  /**
   * Clean up subscriptions.
   */
  removeListeners() {
    if (tokenSubscription) {
      tokenSubscription.remove();
      tokenSubscription = null;
    }
    if (responseSubscription) {
      responseSubscription.remove();
      responseSubscription = null;
    }
  },

  /**
   * Unregister FCM token on logout.
   */
  async unregisterToken() {
    if (currentFcmToken) {
      try {
        await unregisterDeviceToken(currentFcmToken);
        logger.info("[PushNotificationManager] Unregistered FCM token on logout");
      } catch (error) {
        logger.error("[PushNotificationManager] Failed to unregister token on logout:", error);
      } finally {
        currentFcmToken = null;
      }
    }
  },
};

// Register logout callback to unregister FCM token
registerLogoutCallback(() => {
  PushNotificationManager.unregisterToken();
  PushNotificationManager.removeListeners();
});
