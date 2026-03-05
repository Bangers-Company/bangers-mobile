import { SQLiteDatabase } from "expo-sqlite";

export const runMigrations = async (db: SQLiteDatabase) => {
  // For now, schema is handled in sqlite.ts init.
  // This will be used for future schema updates.
  const { user_version } = (await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  )) || { user_version: 0 };

  if (user_version < 1) {
    // Schema already created in initDatabase for version 1
    await db.execAsync("PRAGMA user_version = 1");
  }
};
