import * as SQLite from "expo-sqlite";

const DB_NAME = "bangers.db";
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Global write mutex to prevent concurrent writes causing "database is locked" errors
let writeMutex = Promise.resolve();

export const runExclusive = async <T>(task: () => Promise<T>): Promise<T> => {
  const result = writeMutex.then(task);
  writeMutex = result.catch(() => {}).then(() => {});
  return result;
};

export const getDb = (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
};

export const initDatabase = async () => {
  const db = await getDb();

  // Basic configuration for better concurrency and stability
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_size_limit = 67108864;
    PRAGMA foreign_keys = ON;
    
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      migrated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrations = [
    // Migration 1: Initial Schema
    async (tx: SQLite.SQLiteDatabase) => {
      await tx.execAsync(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          location TEXT,
          start_date TEXT,
          end_date TEXT,
          version INTEGER DEFAULT 1,
          banner_url TEXT,
          created_at TEXT,
          updated_at TEXT,
          deleted_at TEXT
        );

        CREATE TABLE IF NOT EXISTS artists (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          bio TEXT,
          genre TEXT,
          version INTEGER DEFAULT 1,
          image_url TEXT,
          created_at TEXT,
          updated_at TEXT,
          deleted_at TEXT
        );

        CREATE TABLE IF NOT EXISTS acts (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          version INTEGER DEFAULT 1,
          stage_id TEXT,
          date TEXT,
          created_at TEXT,
          updated_at TEXT,
          deleted_at TEXT
        );

        CREATE TABLE IF NOT EXISTS act_artists (
          act_id TEXT NOT NULL,
          artist_id TEXT NOT NULL,
          PRIMARY KEY (act_id, artist_id),
          FOREIGN KEY (act_id) REFERENCES acts (id) ON DELETE CASCADE,
          FOREIGN KEY (artist_id) REFERENCES artists (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS timetables (
          id TEXT PRIMARY KEY NOT NULL,
          event_id TEXT NOT NULL,
          name TEXT NOT NULL,
          is_official INTEGER DEFAULT 0,
          is_public INTEGER DEFAULT 0,
          FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS timetable_entries (
          id TEXT PRIMARY KEY NOT NULL,
          timetable_id TEXT NOT NULL,
          act_id TEXT NOT NULL,
          stage_id TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          FOREIGN KEY (timetable_id) REFERENCES timetables (id) ON DELETE CASCADE,
          FOREIGN KEY (act_id) REFERENCES acts (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS favorites (
          act_id TEXT PRIMARY KEY NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_event_attendance (
          event_id TEXT NOT NULL,
          status TEXT NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (event_id)
        );

        CREATE TABLE IF NOT EXISTS sync_metadata (
          entity_type TEXT PRIMARY KEY NOT NULL,
          last_sync_timestamp TEXT
        );
      `);
    },
    // Migration 2: Performance Indexes
    async (tx: SQLite.SQLiteDatabase) => {
      await tx.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
        CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON events(deleted_at);
        CREATE INDEX IF NOT EXISTS idx_attendance_status ON user_event_attendance(status);
        CREATE INDEX IF NOT EXISTS idx_timetable_event ON timetables(event_id);
        CREATE INDEX IF NOT EXISTS idx_timetable_entries_timetable ON timetable_entries(timetable_id);
        CREATE INDEX IF NOT EXISTS idx_act_artists_act ON act_artists(act_id);
        CREATE INDEX IF NOT EXISTS idx_act_artists_artist ON act_artists(artist_id);
      `);
    },
  ];

  // Get current version
  const row = await db.getFirstAsync<{ version: number }>("SELECT MAX(version) as version FROM _migrations");
  const currentVersion = row?.version ?? 0;

  if (currentVersion < migrations.length) {
    // eslint-disable-next-line no-console
    console.log(`[Database] Upgrading schema from version ${currentVersion} to ${migrations.length}`);
    for (let i = currentVersion; i < migrations.length; i++) {
        const version = i + 1;
        await migrations[i](db);
        await db.runAsync("INSERT INTO _migrations (version) VALUES (?)", [version]);
        // eslint-disable-next-line no-console
        console.log(`[Database] Migrated to version ${version}`);
    }
  }

  return db;
};

export const sanitizeParams = (params: (string | number | boolean | null | undefined)[]) => {
  return params.map((p) => (p === undefined ? null : p));
};
