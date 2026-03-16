import { Timetable } from "../../types/timetable";
import { getDb, sanitizeParams, runExclusive } from "../sqlite";

export const timetablesRepository = {
  upsert: async (timetable: Timetable) => runExclusive(async () => {
    const db = await getDb();

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
        // Clear existing entries for this timetable
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
  }),

  getById: async (id: string): Promise<Timetable | null> => {
    const db = await getDb();
    const row: any = await db.getFirstAsync(
      "SELECT * FROM timetables WHERE id = ?",
      [id],
    );
    if (!row) return null;

    const entries = await db.getAllAsync(
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
      entries: entries.map((e: any) => ({
        id: e.id,
        start_time: e.start_time,
        end_time: e.end_time,
        act: { id: e.act_id, name: e.act_name },
        stage: { id: e.stage_id, name: e.stage_name },
      })),
    } as Timetable;
  },

  getByEventId: async (eventId: string): Promise<Timetable[]> => {
    const db = await getDb();
    const rows = await db.getAllAsync(
      "SELECT * FROM timetables WHERE event_id = ?",
      [eventId],
    );

    const timetables: Timetable[] = [];
    for (const row of rows) {
      const timetable = await timetablesRepository.getById((row as any).id);
      if (timetable) timetables.push(timetable);
    }
    return timetables;
  },
};
