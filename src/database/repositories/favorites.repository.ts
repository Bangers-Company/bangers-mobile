import { getDb, sanitizeParams, runExclusive } from "../sqlite";

export const favoritesRepository = {
  add: async (actId: string) => runExclusive(async () => {
    const db = await getDb();
    await db.runAsync(
      "INSERT OR REPLACE INTO favorites (act_id) VALUES (?)",
      sanitizeParams([actId]),
    );
  }),

  remove: async (actId: string) => runExclusive(async () => {
    const db = await getDb();
    await db.runAsync(
      "DELETE FROM favorites WHERE act_id = ?",
      sanitizeParams([actId]),
    );
  }),

  isFavorite: async (actId: string): Promise<boolean> => {
    const db = await getDb();
    const row = await db.getFirstAsync(
      "SELECT act_id FROM favorites WHERE act_id = ?",
      sanitizeParams([actId]),
    );
    return !!row;
  },

  getAll: async (): Promise<string[]> => {
    const db = await getDb();
    const rows = await db.getAllAsync("SELECT act_id FROM favorites");
    return rows.map((row: any) => row.act_id);
  },
};
