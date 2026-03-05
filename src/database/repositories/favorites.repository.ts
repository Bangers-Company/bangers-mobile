import { getDb } from "../sqlite";

export const favoritesRepository = {
  add: async (actId: string) => {
    const db = await getDb();
    await db.runAsync("INSERT OR REPLACE INTO favorites (act_id) VALUES (?)", [
      actId,
    ]);
  },

  remove: async (actId: string) => {
    const db = await getDb();
    await db.runAsync("DELETE FROM favorites WHERE act_id = ?", [actId]);
  },

  isFavorite: async (actId: string): Promise<boolean> => {
    const db = await getDb();
    const row = await db.getFirstAsync(
      "SELECT act_id FROM favorites WHERE act_id = ?",
      [actId],
    );
    return !!row;
  },

  getAll: async (): Promise<string[]> => {
    const db = await getDb();
    const rows = await db.getAllAsync("SELECT act_id FROM favorites");
    return rows.map((row: any) => row.act_id);
  },
};
