import { Timetable } from "../../types/timetable";
import { sanitizeParams } from "../sqlite";
import { BaseRepository } from "./base.repository";
import { TimetableRow, JoinedTimetableRow, JoinedTimetableEntryRow } from "../types";

class TimetablesRepository extends BaseRepository<Timetable> {
  protected tableName = "timetables";

  async upsert(timetable: Timetable) {
    return this.transaction(async (db) => {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          "INSERT OR REPLACE INTO timetables (id, event_id, name, is_official, is_public) VALUES (?, ?, ?, ?, ?)",
          sanitizeParams([
            timetable.id,
            timetable.event_id,
            timetable.name,
            timetable.is_official ? 1 : 0,
            timetable.is_public ? 1 : 0,
          ]),
        );

        if (timetable.entries) {
          await db.runAsync(
            "DELETE FROM timetable_entries WHERE timetable_id = ?",
            sanitizeParams([timetable.id]),
          );

          for (const entry of timetable.entries) {
            await db.runAsync(
              `INSERT INTO timetable_entries (id, timetable_id, act_id, stage_id, start_time, end_time) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
              sanitizeParams([
                entry.id,
                timetable.id,
                entry.act.id,
                entry.stage.id,
                entry.start_time,
                entry.end_time,
              ]),
            );
          }
        }
      });
    });
  }

  async getById(id: string): Promise<Timetable | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<TimetableRow>(
      "SELECT * FROM timetables WHERE id = ?",
      [id],
    );
    if (!row) return null;

    const entries = await db.getAllAsync<JoinedTimetableEntryRow>(
      `SELECT te.*, a.name as act_name, s.name as stage_name 
         FROM timetable_entries te
         LEFT JOIN acts a ON te.act_id = a.id
         LEFT JOIN stages s ON te.stage_id = s.id
         WHERE te.timetable_id = ?`,
      [id],
    );

    return {
      ...row,
      is_official: !!row.is_official,
      is_public: !!row.is_public,
      entries: entries.map((e) => ({
        id: e.id,
        start_time: e.start_time,
        end_time: e.end_time,
        act: { id: e.act_id, name: e.act_name },
        stage: { id: e.stage_id, name: e.stage_name },
      })),
    } as Timetable;
  }

  async getByEventId(eventId: string): Promise<Timetable[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<JoinedTimetableRow>(
      `SELECT t.*, 
              te.id as entry_id, te.start_time, te.end_time,
              a.id as act_id, a.name as act_name,
              s.id as stage_id, s.name as stage_name
       FROM timetables t
       LEFT JOIN timetable_entries te ON t.id = te.timetable_id
       LEFT JOIN acts a ON te.act_id = a.id
       LEFT JOIN stages s ON te.stage_id = s.id
       WHERE t.event_id = ?`,
      [eventId],
    );

    const timetableMap = new Map<string, Timetable>();

    for (const row of rows) {
      if (!timetableMap.has(row.id)) {
        timetableMap.set(row.id, {
          id: row.id,
          event_id: row.event_id,
          name: row.name,
          is_official: !!row.is_official,
          is_public: !!row.is_public,
          entries: [],
        });
      }

      if (row.entry_id) {
        timetableMap.get(row.id)!.entries!.push({
          id: row.entry_id,
          start_time: row.start_time!,
          end_time: row.end_time!,
          act: { 
            id: row.act_id!, 
            name: row.act_name!,
            version: 0,
            created_at: "",
            updated_at: "",
          } as any, // Temporary cast until full model mapping is standardized
          stage: { 
            id: row.stage_id!, 
            name: row.stage_name!,
            version: 0,
            created_at: "",
            updated_at: "",
          } as any,
        });
      }
    }

    return Array.from(timetableMap.values());
  }
}

export const timetablesRepository = new TimetablesRepository();
