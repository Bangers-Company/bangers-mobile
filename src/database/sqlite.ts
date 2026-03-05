import * as SQLite from "expo-sqlite";

const DB_NAME = "bangers.db";

export const initDatabase = async () => {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
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

    CREATE TABLE IF NOT EXISTS sync_metadata (
      entity_type TEXT PRIMARY KEY NOT NULL,
      last_sync_timestamp TEXT
    );
  `);

  return db;
};

export const getDb = () => SQLite.openDatabaseAsync(DB_NAME);
