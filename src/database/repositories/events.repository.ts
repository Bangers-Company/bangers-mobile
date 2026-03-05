import { Event } from "../../types/event";
import { getDb } from "../sqlite";

export const eventsRepository = {
  upsert: async (event: Event) => {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO events (
        id, name, description, location, start_date, end_date, version, banner_url, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.id,
        event.name,
        event.description,
        event.location,
        event.start_date,
        event.end_date,
        event.version,
        event.banner?.url || null,
        event.created_at,
        event.updated_at,
        event.deleted_at || null,
      ],
    );
  },

  getAll: async (): Promise<Event[]> => {
    const db = await getDb();
    const rows = await db.getAllAsync(
      "SELECT * FROM events WHERE deleted_at IS NULL",
    );
    return rows.map((row: any) => ({
      ...row,
      banner: row.banner_url ? { url: row.banner_url } : null,
    }));
  },

  getById: async (id: string): Promise<Event | null> => {
    const db = await getDb();
    const row: any = await db.getFirstAsync(
      "SELECT * FROM events WHERE id = ?",
      [id],
    );
    if (!row) return null;
    return {
      ...row,
      banner: row.banner_url ? { url: row.banner_url } : null,
    };
  },

  delete: async (id: string) => {
    const db = await getDb();
    await db.runAsync(
      "UPDATE events SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id],
    );
  },

  hardDelete: async (id: string) => {
    const db = await getDb();
    await db.runAsync("DELETE FROM events WHERE id = ?", [id]);
  },

  getAttendingCount: async (): Promise<number> => {
    const db = await getDb();
    const result: any = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM user_event_attendance WHERE status = 'going'",
    );
    return result?.count || 0;
  },

  getAttendingEvents: async (): Promise<Event[]> => {
    const db = await getDb();
    const now = new Date().toISOString();
    const rows = await db.getAllAsync(
      `SELECT e.* FROM events e 
       JOIN user_event_attendance a ON e.id = a.event_id 
       WHERE a.status = 'going' AND e.end_date >= ? AND e.deleted_at IS NULL
       ORDER BY e.start_date ASC`,
      [now],
    );
    return rows.map((row: any) => ({
      ...row,
      banner: row.banner_url ? { url: row.banner_url } : null,
    }));
  },

  getPastEvents: async (): Promise<Event[]> => {
    const db = await getDb();
    const now = new Date().toISOString();
    const rows = await db.getAllAsync(
      `SELECT e.* FROM events e 
       JOIN user_event_attendance a ON e.id = a.event_id 
       WHERE a.status = 'going' AND e.end_date < ? AND e.deleted_at IS NULL
       ORDER BY e.end_date DESC`,
      [now],
    );
    return rows.map((row: any) => ({
      ...row,
      banner: row.banner_url ? { url: row.banner_url } : null,
    }));
  },
};
