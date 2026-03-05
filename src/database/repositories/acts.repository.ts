import { Act } from "../../types/act";
import { getDb } from "../sqlite";

export const actsRepository = {
  upsert: async (act: Act) => {
    const db = await getDb();

    // Use transaction for act and its artists
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT OR REPLACE INTO acts (
            id, name, description, version, stage_id, date, created_at, updated_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          act.id,
          act.name,
          act.description || null,
          act.version,
          act.stage_id || null,
          act.date || null,
          act.created_at,
          act.updated_at,
          act.deleted_at || null,
        ],
      );

      if (act.artists) {
        // Clear existing relations
        await db.runAsync("DELETE FROM act_artists WHERE act_id = ?", [act.id]);

        for (const artist of act.artists) {
          await db.runAsync(
            "INSERT INTO act_artists (act_id, artist_id) VALUES (?, ?)",
            [act.id, artist.id],
          );
        }
      }
    });
  },

  getAllByEvent: async (eventId: string): Promise<Act[]> => {
    const db = await getDb();
    // This requires joining with events or filtering by timetable entries if we want strictly by event
    // For now returning all active acts
    const rows = await db.getAllAsync(
      "SELECT * FROM acts WHERE deleted_at IS NULL",
    );
    return rows as Act[];
  },

  getById: async (id: string): Promise<Act | null> => {
    const db = await getDb();
    const row: any = await db.getFirstAsync("SELECT * FROM acts WHERE id = ?", [
      id,
    ]);
    if (!row) return null;

    // Fetch artists
    const artistRows = await db.getAllAsync(
      `SELECT a.* FROM artists a 
         JOIN act_artists aa ON a.id = aa.artist_id 
         WHERE aa.act_id = ?`,
      [id],
    );

    return {
      ...row,
      artists: artistRows,
    };
  },

  delete: async (id: string) => {
    const db = await getDb();
    await db.runAsync(
      "UPDATE acts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id],
    );
  },

  hardDelete: async (id: string) => {
    const db = await getDb();
    await db.runAsync("DELETE FROM acts WHERE id = ?", [id]);
  },
};
