import { Act } from "../../types/act";
import { sanitizeParams } from "../sqlite";
import { BaseRepository } from "./base.repository";
import { ActRow, ArtistRow } from "../types";

class ActsRepository extends BaseRepository<Act, ActRow> {
  protected tableName = "acts";

  protected mapRow(row: ActRow): Act {
    return {
      ...row,
      description: row.description ?? undefined,
      stage_id: row.stage_id ?? undefined,
      date: row.date ?? undefined,
      deleted_at: row.deleted_at ?? undefined,
    } as Act;
  }

  private mapArtistRow(row: ArtistRow): any {
    return {
      ...row,
      bio: row.bio ?? undefined,
      genre: row.genre ?? undefined,
      image_url: row.image_url ?? undefined,
      deleted_at: row.deleted_at ?? undefined,
    };
  }

  async getById(id: string): Promise<Act | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<ActRow>(
      `SELECT * FROM ${this.tableName} WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    if (!row) return null;

    const artistRows = await db.getAllAsync<ArtistRow>(
      `SELECT a.* FROM artists a 
           JOIN act_artists aa ON a.id = aa.artist_id 
           WHERE aa.act_id = ? AND a.deleted_at IS NULL`,
      [id],
    );

    return {
      ...this.mapRow(row),
      artists: artistRows.map((r) => this.mapArtistRow(r)),
    };
  }

  async getAllByEvent(eventId: string): Promise<Act[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<ActRow>(
      `SELECT DISTINCT a.* FROM acts a
       JOIN timetable_entries te ON a.id = te.act_id
       JOIN timetables t ON te.timetable_id = t.id
       WHERE t.event_id = ? AND a.deleted_at IS NULL`,
      [eventId],
    );
    return rows.map((r) => this.mapRow(r));
  }

  async upsert(act: Act) {
    return this.transaction(async (db) => {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `INSERT OR REPLACE INTO acts (
              id, name, description, version, stage_id, date, created_at, updated_at, deleted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          sanitizeParams([
            act.id,
            act.name,
            act.description || null,
            act.version,
            act.stage_id || null,
            act.date || null,
            act.created_at,
            act.updated_at,
            act.deleted_at || null,
          ]),
        );

        if (act.artists) {
          await db.runAsync("DELETE FROM act_artists WHERE act_id = ?", [act.id]);
          for (const artist of act.artists) {
            await db.runAsync(
              "INSERT INTO act_artists (act_id, artist_id) VALUES (?, ?)",
              sanitizeParams([act.id, artist.id]),
            );
          }
        }
      });
    });
  }

  async batchUpsert(acts: Act[]) {
    return this.transaction(async (db) => {
      await db.withTransactionAsync(async () => {
        for (const act of acts) {
          await db.runAsync(
            `INSERT OR REPLACE INTO acts (
                id, name, description, version, stage_id, date, created_at, updated_at, deleted_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            sanitizeParams([
              act.id,
              act.name,
              act.description || null,
              act.version,
              act.stage_id || null,
              act.date || null,
              act.created_at,
              act.updated_at,
              act.deleted_at || null,
            ]),
          );

          if (act.artists) {
            await db.runAsync("DELETE FROM act_artists WHERE act_id = ?", [
              act.id,
            ]);
            for (const artist of act.artists) {
              await db.runAsync(
                "INSERT INTO act_artists (act_id, artist_id) VALUES (?, ?)",
                sanitizeParams([act.id, artist.id]),
              );
            }
          }
        }
      });
    });
  }
}

export const actsRepository = new ActsRepository();
