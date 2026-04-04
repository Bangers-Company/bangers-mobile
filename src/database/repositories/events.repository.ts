import { Event } from "../../types/event";
import { sanitizeParams } from "../sqlite";
import { BaseRepository } from "./base.repository";
import { JoinedEventRow } from "../types";

class EventsRepository extends BaseRepository<Event, JoinedEventRow> {
  protected tableName = "events";

  protected mapRow(row: JoinedEventRow): Event {
    return {
      ...row,
      banner: row.banner_url ? { url: row.banner_url } : null,
      user_status: (row.status as any) || null,
    } as unknown as Event;
  }


  async upsert(event: Event) {
    return this.transaction(async (db) => {
      await db.runAsync(
        `INSERT OR REPLACE INTO events (
            id, name, description, location, start_date, end_date, version, banner_url, created_at, updated_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        sanitizeParams([
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
        ]),
      );

      if (event.user_status !== undefined) {
        if (event.user_status === null) {
          await db.runAsync(
            "DELETE FROM user_event_attendance WHERE event_id = ?",
            [event.id],
          );
        } else {
          await db.runAsync(
            "INSERT OR REPLACE INTO user_event_attendance (event_id, status) VALUES (?, ?)",
            [event.id, event.user_status],
          );
        }
      }
    });
  }

  async batchUpsert(events: Event[]) {
    return this.transaction(async (db) => {
      await db.withTransactionAsync(async () => {
        for (const event of events) {
          await db.runAsync(
            `INSERT OR REPLACE INTO events (
                id, name, description, location, start_date, end_date, version, banner_url, created_at, updated_at, deleted_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            sanitizeParams([
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
            ]),
          );

          if (event.user_status !== undefined) {
            if (event.user_status === null) {
              await db.runAsync(
                "DELETE FROM user_event_attendance WHERE event_id = ?",
                [event.id],
              );
            } else {
              await db.runAsync(
                "INSERT OR REPLACE INTO user_event_attendance (event_id, status) VALUES (?, ?)",
                [event.id, event.user_status],
              );
            }
          }
        }
      });
    });
  }

  async getAttendingCount(): Promise<number> {
    const db = await this.getDb();
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM user_event_attendance WHERE status = 'going'",
    );
    return result?.count || 0;
  }

  async getAttendingEvents(): Promise<Event[]> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const rows = await db.getAllAsync<JoinedEventRow>(
      `SELECT e.* FROM events e 
         JOIN user_event_attendance uea ON e.id = uea.event_id
         WHERE uea.status = 'going' AND e.end_date >= ? AND e.deleted_at IS NULL
         ORDER BY e.start_date ASC`,
      [now],
    );
    return rows.map((row) => this.mapRow(row));
  }

  async getPastEvents(): Promise<Event[]> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const rows = await db.getAllAsync<JoinedEventRow>(
      `SELECT e.* FROM events e 
         WHERE e.end_date < ? AND e.deleted_at IS NULL
         ORDER BY e.end_date DESC`,
      [now],
    );
    return rows.map((row) => this.mapRow(row));
  }
}

export const eventsRepository = new EventsRepository();
