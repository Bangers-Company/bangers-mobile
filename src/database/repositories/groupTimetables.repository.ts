import { Timetable, TimetableEntry } from "../../types/timetable";
import { Artist } from "../../types/artist";
import { User } from "../../types/user";
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

interface AttendeeRow {
  entry_id: string;
  user_id: string;
  name: string;
  profile_photo_url: string | null;
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
          // 2. Collect unique stages, acts, artists to avoid redundant inserts
          const uniqueStages = new Map<string, any>();
          const uniqueActs = new Map<string, any>();
          const uniqueArtists = new Map<string, any>();
          const actArtistPairs: [string, string][] = [];
          const uniqueUsers = new Map<string, any>();

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
            // Collect unique attendee users
            if (entry.attendees && Array.isArray(entry.attendees)) {
              for (const attendee of entry.attendees) {
                if (attendee.id && !uniqueUsers.has(attendee.id)) {
                  uniqueUsers.set(attendee.id, attendee);
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

          // 7. Batch insert unique attendee users
          for (const user of uniqueUsers.values()) {
            await db.runAsync(
              `INSERT OR REPLACE INTO users (id, name, profile_photo_url) VALUES (?, ?, ?)`,
              [user.id, user.name ?? user.username, user.profile_media_url ?? null]
            );
          }

          // 8. Ensure a shadow timetables row exists for FK satisfaction on timetable_entries
          await db.runAsync(
            `INSERT OR IGNORE INTO timetables (id, event_id, name, is_official, is_public)
               VALUES (?, ?, ?, 0, 0)`,
            sanitizeParams([timetable.id, timetable.event_id, timetable.name]),
          );

          // 9. Ensure timetable_entries rows exist for all group entries
          for (const entry of timetable.entries) {
            if (!entry.act?.id || !entry.stage?.id) continue;
            await db.runAsync(
              `INSERT OR IGNORE INTO timetable_entries (id, timetable_id, act_id, stage_id, start_time, end_time)
                 VALUES (?, ?, ?, ?, ?, ?)`,
              sanitizeParams([
                entry.id, timetable.id, entry.act.id, entry.stage.id,
                entry.start_time, entry.end_time,
              ]),
            );
          }

          // 10. Sync group_timetable_entries pivot rows
          await db.runAsync(
            "DELETE FROM group_timetable_entries WHERE group_timetable_id = ?",
            sanitizeParams([timetable.id]),
          );

          // 11. Bulk delete attendees for this timetable (we'll re-insert fresh)
          await db.runAsync(
            "DELETE FROM timetable_entry_attendees WHERE group_timetable_id = ?",
            [timetable.id]
          );

          for (const entry of timetable.entries) {
            const pivotEntry = entry as TimetableEntry & { pivot?: { added_by?: string, is_attending?: boolean, attending_count?: number } };
            const addedBy = pivotEntry.pivot?.added_by ?? null;
            const attendingCount = pivotEntry.pivot?.attending_count ?? (entry.attendees?.length || 0);
            await db.runAsync(
              `INSERT OR REPLACE INTO group_timetable_entries (group_timetable_id, timetable_entry_id, added_by, attending_count)
                 VALUES (?, ?, ?, ?)`,
              sanitizeParams([timetable.id, entry.id, addedBy, attendingCount]),
            );

            const isAttending = pivotEntry.is_attending ?? pivotEntry.pivot?.is_attending;
            if (typeof isAttending !== 'undefined') {
              await db.runAsync(
                `INSERT OR REPLACE INTO timetable_entry_attendance (entry_id, is_attending) VALUES (?, ?)`,
                [entry.id, isAttending ? 1 : 0]
              );
            }

            // 12. Re-insert attendee links (users already saved in step 7)
            if (entry.attendees && Array.isArray(entry.attendees)) {
              for (const attendee of entry.attendees) {
                if (!attendee.id) continue;
                await db.runAsync(
                  `INSERT OR REPLACE INTO timetable_entry_attendees (group_timetable_id, entry_id, user_id) VALUES (?, ?, ?)`,
                  [timetable.id, entry.id, attendee.id]
                );
              }
            }
          }
        }
      });
    });
  }

  async getEntryAttendees(timetableId: string, entryId: string): Promise<User[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<AttendeeRow>(
      `SELECT tea.entry_id, tea.user_id, u.name, u.profile_photo_url
       FROM timetable_entry_attendees tea
       JOIN users u ON tea.user_id = u.id
       WHERE tea.group_timetable_id = ? AND tea.entry_id = ?`,
      [timetableId, entryId]
    );
    return rows.map(a => ({
      id: a.user_id,
      name: a.name,
      profile_media_url: a.profile_photo_url
    } as User));
  }

  async updateAttendee(timetableId: string, entryId: string, user: User, isAttending: boolean) {
    const db = await this.getDb();
    await db.withTransactionAsync(async () => {
      if (isAttending) {
        // Ensure user exists
        await db.runAsync(
          `INSERT OR REPLACE INTO users (id, name, profile_photo_url) VALUES (?, ?, ?)`,
          [user.id, user.name || user.username, user.profile_media_url ?? null]
        );
        // Add to attendees
        await db.runAsync(
          `INSERT OR REPLACE INTO timetable_entry_attendees (group_timetable_id, entry_id, user_id) VALUES (?, ?, ?)`,
          [timetableId, entryId, user.id]
        );
      } else {
        // Remove from attendees
        await db.runAsync(
          `DELETE FROM timetable_entry_attendees WHERE group_timetable_id = ? AND entry_id = ? AND user_id = ?`,
          [timetableId, entryId, user.id]
        );
      }
    });
  }

  async getByGroupAndEvent(groupId: string, eventId: string): Promise<Timetable | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<GroupTimetableRow>(
      "SELECT * FROM group_timetables WHERE LOWER(group_id) = LOWER(?) AND LOWER(event_id) = LOWER(?)",
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
    const entries = await db.getAllAsync<JoinedGroupTimetableEntryRow & { is_attending: number, attending_count: number }>(
      `SELECT gte.timetable_entry_id, gte.attending_count, te.start_time, te.end_time,
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

    // Fetch ALL attendees for this group timetable in ONE query instead of N queries in a loop
    const allAttendees = await db.getAllAsync<AttendeeRow>(
      `SELECT tea.entry_id, tea.user_id, u.name, u.profile_photo_url
       FROM timetable_entry_attendees tea
       JOIN users u ON tea.user_id = u.id
       WHERE tea.group_timetable_id = ?`,
      [row.id]
    );

    const attendeesByEntryId = new Map<string, AttendeeRow[]>();
    for (const a of allAttendees) {
      if (!attendeesByEntryId.has(a.entry_id)) {
        attendeesByEntryId.set(a.entry_id, []);
      }
      attendeesByEntryId.get(a.entry_id)!.push(a);
    }

    const timetableEntries: TimetableEntry[] = entries.map((e) => {
      const attendees = attendeesByEntryId.get(e.timetable_entry_id) || [];
      return {
        id: e.timetable_entry_id,
        start_time: e.start_time,
        end_time: e.end_time,
        is_attending: !!e.is_attending,
        pivot: {
          is_attending: !!e.is_attending,
          attending_count: e.attending_count || attendees.length,
        },
        attendees: attendees.map((a) => ({
          id: a.user_id,
          name: a.name,
          profile_media_url: a.profile_photo_url,
        } as User)),
        act: { id: e.act_id, name: e.act_name, version: 1, created_at: "", updated_at: "" },
        stage: { id: e.stage_id, name: e.stage_name, version: 1, created_at: "", updated_at: "" },
      };
    });


    return {
      id: row.id,
      event_id: row.event_id,
      name: row.name,
      is_official: false,
      is_public: false,
      entries: timetableEntries,
    };
  }
}

export const groupTimetablesRepository = new GroupTimetablesRepository();

