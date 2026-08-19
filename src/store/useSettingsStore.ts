import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../i18n";

interface SettingsState {
  language: string;
  notificationsEnabled: boolean;
  notificationMinutesBefore: number;
  setLanguage: (lang: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationMinutesBefore: (minutes: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: i18n.language || "en",
      notificationsEnabled: true,
      notificationMinutesBefore: 15,
      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ language: lang });
      },
      setNotificationsEnabled: (enabled) => {
        set({ notificationsEnabled: enabled });
        import("../services/notifications/NotificationService").then(({ NotificationService }) => {
          NotificationService.rescheduleAll();
        });
      },
      setNotificationMinutesBefore: (minutes) => {
        set({ notificationMinutesBefore: minutes });
        import("../services/notifications/NotificationService").then(({ NotificationService }) => {
          NotificationService.rescheduleAll();
        });
      },
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
