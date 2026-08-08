import { Timetable } from "../../types/timetable";
import { Act } from "../../types/act";
import { Stage } from "../../types/event";
import { Artist } from "../../types/artist";
import { sanitizeParams } from "../sqlite";
import { BaseRepository } from "./base.repository";
import { TimetableRow, JoinedTimetableRow, JoinedTimetableEntryRow } from "../types";

class TimetablesRepository extends BaseRepository<Timetable> {
  protected tableName = "timetables";

  async upsert(timetable: Timetable) {
    return this.transaction(async (db) => {
      await db.withTransactionAsync(async () => {
        // 1. Upsert the timetable itself
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

        if (timetable.entries && timetable.entries.length > 0) {
          // 2. Collect unique stages, acts, artists to avoid redundant inserts
          const uniqueStages = new Map<string, any>();
          const uniqueActs = new Map<string, any>();
          const uniqueArtists = new Map<string, any>();
          const actArtistPairs: [string, string][] = [];

          for (const entry of timetable.entries) {
            if (entry.stage?.id && !uniqueStages.has(entry.stage.id)) {
              uniqueStages.set(entry.stage.id, entry.stage);
            }
            if (entry.act?.id && !uniqueActs.has(entry.act.id)) {
              uniqueActs.set(entry.act.id, entry.act);
              const artists: Artist[] | undefined = entry.act.artists;
              if (Array.isArray(artists)) {
                for (const artist of artists) {
                  if (artist?.id && !uniqueArtists.has(artist.id)) {
                    uniqueArtists.set(artist.id, artist);
                  }
                  if (artist?.id) {
                    actArtistPairs.push([entry.act.id, artist.id]);
                  }
                }
              }
            }
          }

          // 3. Batch insert unique stages
          for (const stage of uniqueStages.values()) {
            await db.runAsync(
              `INSERT OR IGNORE INTO stages (id, name, description, version, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
              sanitizeParams([
                stage.id, stage.name ?? "Unknown Stage", stage.description ?? null,
                stage.version ?? 1, stage.created_at ?? null, stage.updated_at ?? null,
              ]),
            );
          }

          // 4. Batch insert unique acts
          for (const act of uniqueActs.values()) {
            await db.runAsync(
              `INSERT OR IGNORE INTO acts (id, name, description, version, stage_id, date, created_at, updated_at, deleted_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              sanitizeParams([
                act.id, act.name ?? "Unknown Act", act.description ?? null,
                act.version ?? 1, act.stage_id ?? null, act.date ?? null,
                act.created_at ?? null, act.updated_at ?? null, null,
              ]),
            );
          }

          // 5. Batch insert unique artists
          for (const artist of uniqueArtists.values()) {
            await db.runAsync(
              `INSERT OR IGNORE INTO artists (id, name, bio, genre, version, image_url, created_at, updated_at, deleted_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              sanitizeParams([
                artist.id, artist.name ?? "Unknown Artist", artist.bio ?? null,
                artist.genre ?? null, artist.version ?? 1, artist.image?.url ?? null,
                artist.created_at ?? null, artist.updated_at ?? null, null,
              ]),
            );
          }

          // 6. Batch insert act-artist links
          for (const [actId, artistId] of actArtistPairs) {
            await db.runAsync(
              `INSERT OR IGNORE INTO act_artists (act_id, artist_id) VALUES (?, ?)`,
              sanitizeParams([actId, artistId]),
            );
          }

          // 7. Delete stale entries then insert fresh ones (FK deps now satisfied)
          await db.runAsync(
            "DELETE FROM timetable_entries WHERE timetable_id = ?",
            sanitizeParams([timetable.id]),
          );

          for (const entry of timetable.entries) {
            await db.runAsync(
              `INSERT OR REPLACE INTO timetable_entries (id, timetable_id, act_id, stage_id, start_time, end_time)
                 VALUES (?, ?, ?, ?, ?, ?)`,
              sanitizeParams([
                entry.id, timetable.id, entry.act.id, entry.stage.id,
                entry.start_time, entry.end_time,
              ]),
            );
            if (typeof entry.is_attending !== 'undefined') {
              await db.runAsync(
                `INSERT OR REPLACE INTO timetable_entry_attendance (entry_id, is_attending) VALUES (?, ?)`,
                sanitizeParams([entry.id, entry.is_attending ? 1 : 0])
              );
            }
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

    const entries = await db.getAllAsync<JoinedTimetableEntryRow & { is_attending: number }>(
      `SELECT te.*, a.name as act_name, s.name as stage_name, tea.is_attending 
         FROM timetable_entries te
         LEFT JOIN acts a ON te.act_id = a.id
         LEFT JOIN stages s ON te.stage_id = s.id
         LEFT JOIN timetable_entry_attendance tea ON te.id = tea.entry_id
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
        is_attending: !!e.is_attending,
        act: { id: e.act_id, name: e.act_name },
        stage: { id: e.stage_id, name: e.stage_name },
      })),
    } as Timetable;
  }

  async getByEventId(eventId: string): Promise<Timetable[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<JoinedTimetableRow & { is_attending: number }>(
      `SELECT t.*, 
              te.id as entry_id, te.start_time, te.end_time,
              a.id as act_id, a.name as act_name,
              s.id as stage_id, s.name as stage_name,
              tea.is_attending
       FROM timetables t
       LEFT JOIN timetable_entries te ON t.id = te.timetable_id
       LEFT JOIN acts a ON te.act_id = a.id
       LEFT JOIN stages s ON te.stage_id = s.id
       LEFT JOIN timetable_entry_attendance tea ON te.id = tea.entry_id
       WHERE LOWER(t.event_id) = LOWER(?)`,
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
          is_attending: !!row.is_attending,
          act: { 
            id: row.act_id!, 
            name: row.act_name!,
            version: 0,
            created_at: "",
            updated_at: "",
          } as Act,
          stage: { 
            id: row.stage_id!, 
            name: row.stage_name!,
            version: 0,
            created_at: "",
            updated_at: "",
          } as Stage,
        });
      }
    }

    return Array.from(timetableMap.values());
  }
}

export const timetablesRepository = new TimetablesRepository();
