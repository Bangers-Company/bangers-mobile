import { User } from "../../types/user";
import { sanitizeParams } from "../sqlite";
import { BaseRepository } from "./base.repository";

class UsersRepository extends BaseRepository<User> {
  protected tableName = "users";

  async upsertMe(user: User) {
    return this.transaction(async (db) => {
      await db.runAsync(
        `INSERT OR REPLACE INTO users (
            id, name, username, first_name, last_name, profile_photo_url, 
            friends_count, upcoming_count, past_count
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        sanitizeParams([
          user.id,
          user.name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username,
          user.username,
          user.first_name || null,
          user.last_name || null,
          user.profile_media_url || null,
          user.friends_count || 0,
          user.stats?.upcoming_count || user.attendingEvents?.length || 0,
          user.stats?.past_count || user.pastEvents?.length || 0,
        ]),
      );
    });
  }

  async getMe(): Promise<User | null> {
    const db = await this.getDb();
    // Assuming the first user in the table is 'me' for now, or we filter by a known ID.
    // In a real app, we'd store the current user's ID in SecureStore.
    const row = await db.getFirstAsync<any>("SELECT * FROM users LIMIT 1");
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      username: row.username,
      first_name: row.first_name,
      last_name: row.last_name,
      profile_media_url: row.profile_photo_url,
      friends_count: row.friends_count,
      stats: {
        upcoming_count: row.upcoming_count,
        past_count: row.past_count,
      },
      // These will be hydrated by the hook if needed
      attendingEvents: [],
      pastEvents: [],
    } as unknown as User;
  }
}

export const usersRepository = new UsersRepository();
