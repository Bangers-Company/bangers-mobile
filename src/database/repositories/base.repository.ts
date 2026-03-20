import { SQLiteDatabase } from "expo-sqlite";
import { getDb, runExclusive } from "../sqlite";

export abstract class BaseRepository<T extends { id: string }, R = T> {
  protected abstract tableName: string;

  protected mapRow(row: R): T {
    return row as unknown as T;
  }

  protected async getDb(): Promise<SQLiteDatabase> {
    return await getDb();
  }

  async getAll(): Promise<T[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<R>(`SELECT * FROM ${this.tableName} WHERE deleted_at IS NULL`);
    return rows.map((row) => this.mapRow(row));
  }

  async getById(id: string): Promise<T | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<R>(
      `SELECT * FROM ${this.tableName} WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    return row ? this.mapRow(row) : null;
  }

  async hardDelete(id: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
  }

  async batchHardDelete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await this.getDb();
    const placeholders = ids.map(() => "?").join(",");
    await db.runAsync(
      `DELETE FROM ${this.tableName} WHERE id IN (${placeholders})`,
      ids,
    );
  }

  async softDelete(id: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id],
    );
  }

  async batchSoftDelete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await this.getDb();
    const placeholders = ids.map(() => "?").join(",");
    await db.runAsync(
      `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
      ids,
    );
  }

  protected async transaction<R>(callback: (db: SQLiteDatabase) => Promise<R>): Promise<R> {
    return await runExclusive(async () => {
      const db = await this.getDb();
      return await callback(db);
    });
  }
}
