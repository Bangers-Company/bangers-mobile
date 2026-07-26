import { getDb } from "../../database/sqlite";
import { useSettingsStore } from "../../store/useSettingsStore";
import { NotificationScheduler } from "../../infrastructure/notifications/NotificationScheduler";
import { format } from "date-fns";

export const NotificationService = {
  async initialize() {
    const enabled = useSettingsStore.getState().notificationsEnabled;
    if (enabled) {
      await NotificationScheduler.requestPermissions();
      // On init, we could rescheduleAll to ensure consistency, 
      // but maybe it's too heavy. Let's do it once to be safe.
      await this.rescheduleAll();
    }
  },

  async scheduleForEntry(entryId: string) {
    const { notificationsEnabled, notificationMinutesBefore } = useSettingsStore.getState();
    if (!notificationsEnabled) return;

    const db = await getDb();
    const entry = await db.getFirstAsync<any>(
      `SELECT te.start_time, a.name as act_name, s.name as stage_name, t.name as timetable_name
       FROM timetable_entries te
       JOIN acts a ON te.act_id = a.id
       JOIN stages s ON te.stage_id = s.id
       JOIN timetables t ON te.timetable_id = t.id
       WHERE te.id = ?`,
      [entryId]
    );

    if (!entry) {
      console.warn(`[NotificationService] No entry found in DB for ${entryId}`);
      return;
    }

    const startTime = new Date(entry.start_time);
    if (isNaN(startTime.getTime())) {
      console.error(`[NotificationService] Invalid start_time for entry ${entryId}: ${entry.start_time}`);
      return;
    }

    const triggerDate = new Date(startTime.getTime() - notificationMinutesBefore * 60000);
    const now = new Date();

    console.log(`[NotificationService] Scheduling: ${entry.act_name} at ${startTime.toISOString()}. Trigger at: ${triggerDate.toISOString()}. Now: ${now.toISOString()}`);

    if (triggerDate <= now) {
      console.log(`[NotificationService] Trigger date ${triggerDate.toISOString()} is in the past, skipping.`);
      return;
    }

    const title = `${entry.act_name} is starting soon!`;
    const body = `On ${entry.stage_name} at ${format(startTime, "HH:mm")} (${entry.timetable_name})`;

    await NotificationScheduler.schedule(entryId, title, body, triggerDate);
  },

  async cancelForEntry(entryId: string) {
    await NotificationScheduler.cancel(entryId);
  },

  async rescheduleAll() {
    await NotificationScheduler.cancelAll();
    // Give it a tiny bit of time to settle
    await new Promise(resolve => setTimeout(resolve, 100));

    const { notificationsEnabled, notificationMinutesBefore } = useSettingsStore.getState();
    if (!notificationsEnabled) return;

    const db = await getDb();
    const activeEntries = await db.getAllAsync<any>(
      `SELECT te.id, te.start_time, a.name as act_name, s.name as stage_name, t.name as timetable_name
       FROM timetable_entries te
       JOIN timetable_entry_attendance tea ON te.id = tea.entry_id
       JOIN acts a ON te.act_id = a.id
       JOIN stages s ON te.stage_id = s.id
       JOIN timetables t ON te.timetable_id = t.id
       WHERE tea.is_attending = 1`
    );

    console.log(`[NotificationService] Found ${activeEntries.length} active entries to reschedule`);

    const now = new Date();
    let scheduledCount = 0;

    for (const entry of activeEntries) {
      const startTime = new Date(entry.start_time);
      if (isNaN(startTime.getTime())) {
        console.warn(`[NotificationService] Skipping entry ${entry.id} due to invalid date: ${entry.start_time}`);
        continue;
      }

      const triggerDate = new Date(startTime.getTime() - notificationMinutesBefore * 60000);

      if (triggerDate > now) {
        const title = `${entry.act_name} is starting soon!`;
        const body = `On ${entry.stage_name} at ${format(startTime, "HH:mm")} (${entry.timetable_name})`;
        await NotificationScheduler.schedule(entry.id, title, body, triggerDate);
        scheduledCount++;
      }
    }
    console.log(`[NotificationService] Successfully scheduled ${scheduledCount} notifications`);
  }
};
