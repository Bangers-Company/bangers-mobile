import { SQLiteDatabase } from "expo-sqlite";

const migrations: Record<number, (_db: SQLiteDatabase) => Promise<void>> = {
  1: async (_db) => {
    // Schema already exist in initDatabase for version 1
  },
  2: async (_db) => {
    // Example for future migration:
    // await db.execAsync("ALTER TABLE events ADD COLUMN category TEXT");
  },
};

export const runMigrations = async (db: SQLiteDatabase) => {
  const result = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  let user_version = result?.user_version || 0;

  for (const [version, migrate] of Object.entries(migrations)) {
    const v = Number(version);
    if (user_version < v) {
      await migrate(db);
      await db.execAsync(`PRAGMA user_version = ${v}`);
      user_version = v;
    }
  }
};
