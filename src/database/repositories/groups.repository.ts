import { Group } from "../../types/group";
import { User } from "../../types/user";
import { Timetable } from "../../types/timetable";
import { sanitizeParams } from "../sqlite";
import { BaseRepository } from "./base.repository";
import { SQLiteDatabase } from "expo-sqlite";

class GroupsRepository extends BaseRepository<Group> {
  protected tableName = "groups";

  async upsert(group: Group) {
    return this.transaction(async (db) => {
      await db.withTransactionAsync(async () => {
        // 1. Upsert the group itself
        await db.runAsync(
          `INSERT OR REPLACE INTO groups (id, name, description, owner_id, members_count, invitation_status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          sanitizeParams([
            group.id,
            group.name,
            group.description ?? null,
            group.owner_id,
            group.members_count ?? (group.members?.length || 0),
            group.pivot?.invitation_status ?? null,
            group.created_at,
            group.updated_at,
          ]),
        );

        // 2. Handle members if present
        if (group.members && group.members.length > 0) {
          // Delete existing members to sync fresh
          await db.runAsync("DELETE FROM group_members WHERE group_id = ?", [group.id]);

          for (const member of group.members) {
            // Ensure user exists
            await db.runAsync(
              `INSERT OR REPLACE INTO users (id, name, profile_photo_url) VALUES (?, ?, ?)`,
              sanitizeParams([member.id, member.name, member.profile_photo_url ?? null])
            );

            // Link member to group
            await db.runAsync(
              `INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)`,
              [group.id, member.id]
            );
          }
        }

        // 3. Handle embedded timetables if present (metadata only)
        if (group.timetables && group.timetables.length > 0) {
          for (const timetable of group.timetables) {
            await db.runAsync(
              `INSERT OR REPLACE INTO group_timetables (id, group_id, event_id, name, version)
               VALUES (?, ?, ?, ?, ?)`,
              sanitizeParams([
                timetable.id,
                group.id,
                timetable.event_id,
                timetable.name,
                1,
              ])
            );
          }
        }
      });
    });
  }

  async getAll(): Promise<Group[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<any>("SELECT * FROM groups ORDER BY updated_at DESC");
    
    const groups: Group[] = [];
    for (const row of rows) {
      const members = await this.getMembers(db, row.id);
      const timetables = await this.getGroupTimetables(db, row.id);
      
      groups.push({
        id: row.id,
        name: row.name,
        description: row.description,
        owner_id: row.owner_id,
        members_count: row.members_count,
        pivot: row.invitation_status ? {
            invitation_status: row.invitation_status,
            role: row.owner_id === "TODO_AUTH_USER_ID" ? "admin" : "member" // We'll fix this in the service/hook
        } : undefined,
        members,
        timetables,
        created_at: row.created_at,
        updated_at: row.updated_at,
      } as Group);
    }
    return groups;
  }

  private async getMembers(db: SQLiteDatabase, groupId: string): Promise<User[]> {
    const rows = await db.getAllAsync<any>(
      `SELECT u.* FROM users u
       JOIN group_members gm ON u.id = gm.user_id
       WHERE gm.group_id = ?`,
      [groupId]
    );
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      profile_photo_url: r.profile_photo_url
    } as User));
  }

  private async getGroupTimetables(db: SQLiteDatabase, groupId: string): Promise<Timetable[]> {
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM group_timetables WHERE group_id = ?`,
      [groupId]
    );
    return rows.map(r => ({
      id: r.id,
      event_id: r.event_id,
      name: r.name,
      entries: [] // Metadata only
    } as Timetable));
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync("DELETE FROM groups WHERE id = ?", [id]);
  }
}

export const groupsRepository = new GroupsRepository();

