import { Timetable, TimetableEntry } from "../../types/timetable";
import { Artist } from "../../types/artist";
import { sanitizeParams } from "../sqlite";
import { BaseRepository } from "./base.repository";
import { SQLiteDatabase } from "expo-sqlite";

interface GroupTimetableRow {
  id: string;
  group_id: string;
  event_id: string;
  name: string;
  version: number;
  created_at: string | null;
  updated_at: string | null;
}

interface JoinedGroupTimetableEntryRow {
  timetable_entry_id: string;
  start_time: string;
  end_time: string;
  act_id: string;
  act_name: string;
  stage_id: string;
  stage_name: string;
}

type GroupTimetable = Timetable & {
  group_id?: string;
  version?: number;
  created_at?: string;
  updated_at?: string;
};

class GroupTimetablesRepository extends BaseRepository<Timetable> {
  protected tableName = "group_timetables";

  /**
   * Upsert a group timetable and all its entries.
   * Pre-saves embedded stages/acts/artists before inserting entries
   * to satisfy foreign key constraints on timetable_entries.
   */
  async upsert(timetable: GroupTimetable) {
    return this.transaction(async (db) => {
      await db.withTransactionAsync(async () => {
        // 1. Upsert the group timetable row
        await db.runAsync(
          `INSERT OR REPLACE INTO group_timetables (id, group_id, event_id, name, version, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          sanitizeParams([
            timetable.id,
            timetable.group_id ?? null,
            timetable.event_id,
            timetable.name,
            timetable.version ?? 1,
            timetable.created_at ?? null,
            timetable.updated_at ?? null,
          ]),
        );

        if (timetable.entries && timetable.entries.length > 0) {
          // 2. Pre-save embedded stages
          for (const entry of timetable.entries) {
            if (entry.stage?.id) {
              await db.runAsync(
                `INSERT OR IGNORE INTO stages (id, name, description, version, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?)`,
                sanitizeParams([
                  entry.stage.id,
                  entry.stage.name ?? "Unknown Stage",
                  entry.stage.description ?? null,
                  entry.stage.version ?? 1,
                  entry.stage.created_at ?? null,
                  entry.stage.updated_at ?? null,
                ]),
              );
            }
          }

          // 3. Pre-save embedded acts and artists
          for (const entry of timetable.entries) {
            if (entry.act?.id) {
              await db.runAsync(
                `INSERT OR IGNORE INTO acts (id, name, description, version, stage_id, date, created_at, updated_at, deleted_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                sanitizeParams([
                  entry.act.id,
                  entry.act.name ?? "Unknown Act",
                  entry.act.description ?? null,
                  entry.act.version ?? 1,
                  entry.act.stage_id ?? null,
                  entry.act.date ?? null,
                  entry.act.created_at ?? null,
                  entry.act.updated_at ?? null,
                  null,
                ]),
              );

              const artists: Artist[] | undefined = entry.act.artists;
              if (Array.isArray(artists) && artists.length > 0) {
                for (const artist of artists) {
                  if (!artist?.id) continue;
                  await db.runAsync(
                    `INSERT OR IGNORE INTO artists (id, name, bio, genre, version, image_url, created_at, updated_at, deleted_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    sanitizeParams([
                      artist.id,
                      artist.name ?? "Unknown Artist",
                      artist.bio ?? null,
                      artist.genre ?? null,
                      artist.version ?? 1,
                      artist.image?.url ?? null,
                      artist.created_at ?? null,
                      artist.updated_at ?? null,
                      null,
                    ]),
                  );
                  await db.runAsync(
                    `INSERT OR IGNORE INTO act_artists (act_id, artist_id) VALUES (?, ?)`,
                    sanitizeParams([entry.act.id, artist.id]),
                  );
                }
              }
            }
          }

          // 4. Ensure a shadow timetables row exists for FK satisfaction on timetable_entries
          await db.runAsync(
            `INSERT OR IGNORE INTO timetables (id, event_id, name, is_official, is_public)
               VALUES (?, ?, ?, 0, 0)`,
            sanitizeParams([timetable.id, timetable.event_id, timetable.name]),
          );

          // 5. Ensure timetable_entries rows exist for all group entries
          for (const entry of timetable.entries) {
            if (!entry.act?.id || !entry.stage?.id) continue;
            await db.runAsync(
              `INSERT OR IGNORE INTO timetable_entries (id, timetable_id, act_id, stage_id, start_time, end_time)
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

          // 6. Sync group_timetable_entries pivot rows
          await db.runAsync(
            "DELETE FROM group_timetable_entries WHERE group_timetable_id = ?",
            sanitizeParams([timetable.id]),
          );

          for (const entry of timetable.entries) {
            const pivotEntry = entry as TimetableEntry & { pivot?: { added_by?: string, is_attending?: boolean } };
            const addedBy = pivotEntry.pivot?.added_by ?? null;
            await db.runAsync(
              `INSERT OR IGNORE INTO group_timetable_entries (group_timetable_id, timetable_entry_id, added_by)
                 VALUES (?, ?, ?)`,
              sanitizeParams([timetable.id, entry.id, addedBy]),
            );

            const isAttending = pivotEntry.is_attending ?? pivotEntry.pivot?.is_attending;
            if (typeof isAttending !== 'undefined') {
              await db.runAsync(
                `INSERT OR REPLACE INTO timetable_entry_attendance (entry_id, is_attending) VALUES (?, ?)`,
                sanitizeParams([entry.id, isAttending ? 1 : 0])
              );
            }
          }
        }
      });
    });
  }

  async getByGroupAndEvent(groupId: string, eventId: string): Promise<Timetable | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<GroupTimetableRow>(
      "SELECT * FROM group_timetables WHERE group_id = ? AND event_id = ?",
      [groupId, eventId],
    );
    if (!row) return null;
    return this.buildTimetable(db, row);
  }

  async getById(id: string): Promise<Timetable | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<GroupTimetableRow>(
      "SELECT * FROM group_timetables WHERE id = ?",
      [id],
    );
    if (!row) return null;
    return this.buildTimetable(db, row);
  }

  private async buildTimetable(db: SQLiteDatabase, row: GroupTimetableRow): Promise<Timetable> {
    const entries = await db.getAllAsync<JoinedGroupTimetableEntryRow & { is_attending: number }>(
      `SELECT gte.timetable_entry_id, te.start_time, te.end_time,
              te.act_id, a.name as act_name,
              te.stage_id, s.name as stage_name,
              tea.is_attending
         FROM group_timetable_entries gte
         JOIN timetable_entries te ON gte.timetable_entry_id = te.id
         LEFT JOIN acts a ON te.act_id = a.id
         LEFT JOIN stages s ON te.stage_id = s.id
         LEFT JOIN timetable_entry_attendance tea ON te.id = tea.entry_id
         WHERE gte.group_timetable_id = ?
         ORDER BY te.start_time`,
      [row.id],
    );

    return {
      id: row.id,
      event_id: row.event_id,
      name: row.name,
      is_official: false,
      is_public: false,
      entries: entries.map((e) => ({
        id: e.timetable_entry_id,
        start_time: e.start_time,
        end_time: e.end_time,
        is_attending: !!e.is_attending,
        pivot: { is_attending: !!e.is_attending },
        act: { id: e.act_id, name: e.act_name, version: 1, created_at: "", updated_at: "" },
        stage: { id: e.stage_id, name: e.stage_name, version: 1, created_at: "", updated_at: "" },
      })),
    };
  }
}

export const groupTimetablesRepository = new GroupTimetablesRepository();
