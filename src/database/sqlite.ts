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
    // Migration 3: Stages table + group timetable tables + attendance cache
    async (tx: SQLite.SQLiteDatabase) => {
      await tx.execAsync(`
        -- Stages (reusable across events, matches backend)
        CREATE TABLE IF NOT EXISTS stages (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          version INTEGER DEFAULT 1,
          created_at TEXT,
          updated_at TEXT,
          deleted_at TEXT
        );

        -- Group timetables (local cache of group schedules)
        CREATE TABLE IF NOT EXISTS group_timetables (
          id TEXT PRIMARY KEY NOT NULL,
          group_id TEXT NOT NULL,
          event_id TEXT NOT NULL,
          name TEXT NOT NULL,
          version INTEGER DEFAULT 1,
          created_at TEXT,
          updated_at TEXT,
          FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
        );

        -- Group timetable entries (pivot: which official entries belong to a group timetable)
        CREATE TABLE IF NOT EXISTS group_timetable_entries (
          group_timetable_id TEXT NOT NULL,
          timetable_entry_id TEXT NOT NULL,
          added_by TEXT,
          PRIMARY KEY (group_timetable_id, timetable_entry_id),
          FOREIGN KEY (group_timetable_id) REFERENCES group_timetables (id) ON DELETE CASCADE,
          FOREIGN KEY (timetable_entry_id) REFERENCES timetable_entries (id) ON DELETE CASCADE
        );

        -- Personal timetable entry attendance cache (mirrors user_timetable_favorites)
        CREATE TABLE IF NOT EXISTS timetable_entry_attendance (
          entry_id TEXT PRIMARY KEY NOT NULL,
          is_attending INTEGER NOT NULL DEFAULT 0,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);
    },
    // Migration 4: Indexes for new tables
    async (tx: SQLite.SQLiteDatabase) => {
      await tx.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_stages_deleted_at ON stages(deleted_at);
        CREATE INDEX IF NOT EXISTS idx_group_timetables_event ON group_timetables(event_id);
        CREATE INDEX IF NOT EXISTS idx_group_timetables_group ON group_timetables(group_id);
        CREATE INDEX IF NOT EXISTS idx_group_timetable_entries_tt ON group_timetable_entries(group_timetable_id);
        CREATE INDEX IF NOT EXISTS idx_group_timetable_entries_entry ON group_timetable_entries(timetable_entry_id);
      `);
    },
    // Migration 5: Users, Attendees and Groups for offline visibility
    async (tx: SQLite.SQLiteDatabase) => {
      await tx.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          profile_photo_url TEXT
        );

        CREATE TABLE IF NOT EXISTS timetable_entry_attendees (
          entry_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          PRIMARY KEY (entry_id, user_id),
          FOREIGN KEY (entry_id) REFERENCES timetable_entries (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS groups (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          owner_id TEXT,
          members_count INTEGER DEFAULT 0,
          invitation_status TEXT,
          created_at TEXT,
          updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS group_members (
          group_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          PRIMARY KEY (group_id, user_id),
          FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_timetable_entry_attendees_entry ON timetable_entry_attendees(entry_id);
        CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
      `);
    },
    // Migration 6: Add group_timetable_id to attendees to support multiple groups
    async (tx: SQLite.SQLiteDatabase) => {
      await tx.execAsync(`
        DROP TABLE IF EXISTS timetable_entry_attendees;
        CREATE TABLE IF NOT EXISTS timetable_entry_attendees (
          group_timetable_id TEXT NOT NULL,
          entry_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          PRIMARY KEY (group_timetable_id, entry_id, user_id),
          FOREIGN KEY (group_timetable_id) REFERENCES group_timetables (id) ON DELETE CASCADE,
          FOREIGN KEY (entry_id) REFERENCES timetable_entries (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_timetable_entry_attendees_group_entry ON timetable_entry_attendees(group_timetable_id, entry_id);
      `);
    },
    // Migration 7: Add attending_count to group_timetable_entries for offline visibility
    async (tx: SQLite.SQLiteDatabase) => {
      await tx.execAsync(`
        ALTER TABLE group_timetable_entries ADD COLUMN attending_count INTEGER DEFAULT 0;
      `);
    },
    // Migration 8: Add attendee_count to events for offline visibility
    async (tx: SQLite.SQLiteDatabase) => {
      await tx.execAsync(`
        ALTER TABLE events ADD COLUMN attendee_count INTEGER DEFAULT 0;
      `);
    },
    // Migration 9: Add event_id to groups to link groups to specific events
    async (tx: SQLite.SQLiteDatabase) => {
      await tx.execAsync(`
        ALTER TABLE groups ADD COLUMN event_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_groups_event ON groups(event_id);
      `);
    },
    // Migration 10: Extend users table for full offline profile visibility
    async (tx: SQLite.SQLiteDatabase) => {
      await tx.execAsync(`
        ALTER TABLE users ADD COLUMN username TEXT;
        ALTER TABLE users ADD COLUMN first_name TEXT;
        ALTER TABLE users ADD COLUMN last_name TEXT;
        ALTER TABLE users ADD COLUMN friends_count INTEGER DEFAULT 0;
        ALTER TABLE users ADD COLUMN upcoming_count INTEGER DEFAULT 0;
        ALTER TABLE users ADD COLUMN past_count INTEGER DEFAULT 0;
      `);
    },
    // Migration 11: Speed up timetable entry, group timetable and attendance queries
    async (tx: SQLite.SQLiteDatabase) => {
      await tx.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_group_timetables_group_event ON group_timetables(group_id, event_id);
        CREATE INDEX IF NOT EXISTS idx_timetable_entries_timetable_start ON timetable_entries(timetable_id, start_time);
        CREATE INDEX IF NOT EXISTS idx_timetable_entries_act ON timetable_entries(act_id);
        CREATE INDEX IF NOT EXISTS idx_timetable_entries_stage ON timetable_entries(stage_id);
        CREATE INDEX IF NOT EXISTS idx_timetable_entry_attendance_entry ON timetable_entry_attendance(entry_id);
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
