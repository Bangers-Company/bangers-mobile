import { Artist } from "../../types/artist";
import { getDb } from "../sqlite";

export const artistsRepository = {
  upsert: async (artist: Artist) => {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO artists (
        id, name, bio, genre, version, image_url, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        artist.id,
        artist.name,
        artist.bio || null,
        artist.genre || null,
        artist.version,
        artist.image?.url || null,
        artist.created_at,
        artist.updated_at,
        artist.deleted_at || null,
      ],
    );
  },

  getAll: async (): Promise<Artist[]> => {
    const db = await getDb();
    const rows = await db.getAllAsync(
      "SELECT * FROM artists WHERE deleted_at IS NULL",
    );
    return rows.map((row: any) => ({
      ...row,
      image: row.image_url ? { url: row.image_url } : null,
    }));
  },

  getById: async (id: string): Promise<Artist | null> => {
    const db = await getDb();
    const row: any = await db.getFirstAsync(
      "SELECT * FROM artists WHERE id = ?",
      [id],
    );
    if (!row) return null;
    return {
      ...row,
      image: row.image_url ? { url: row.image_url } : null,
    };
  },

  delete: async (id: string) => {
    const db = await getDb();
    await db.runAsync(
      "UPDATE artists SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id],
    );
  },

  hardDelete: async (id: string) => {
    const db = await getDb();
    await db.runAsync("DELETE FROM artists WHERE id = ?", [id]);
  },
};
