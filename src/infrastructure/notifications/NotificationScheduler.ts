import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log(`[NotificationHandler] Received notification: ${notification.request.identifier} (Scheduled for: ${notification.date})`);
    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});

export const NotificationScheduler = {
  async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('timetable-reminders', {
        name: 'Timetable Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#a60df2',
      });
    }

    return finalStatus === "granted";
  },

  async schedule(id: string, title: string, body: string, date: Date) {
    const seconds = Math.floor((date.getTime() - Date.now()) / 1000);
    console.log(`[NotificationScheduler] Scheduling ${id} in ${seconds} seconds (for ${date.toLocaleString()})`);
    if (seconds <= 0) return null;

    try {
      return await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          color: "#a60df2",
          channelId: "timetable-reminders",
        },
        trigger: {
          type: "timeInterval",
          seconds: seconds,
          repeats: false,
          channelId: "timetable-reminders",
        } as any,
      });
    } catch (e) {
      console.error("[NotificationScheduler] Error scheduling notification", e);
      return null;
    }
  },

  async cancel(id: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      console.error("[NotificationScheduler] Error canceling notification", e);
    }
  },

  async cancelAll() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.error("[NotificationScheduler] Error canceling all notifications", e);
    }
  },
  
  async getScheduledIds() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.map(n => n.identifier);
  }
};
