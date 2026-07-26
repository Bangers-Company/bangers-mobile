import { Artist } from "../../types/artist";
import { sanitizeParams } from "../sqlite";
import { BaseRepository } from "./base.repository";

import { ArtistRow } from "../types";

class ArtistsRepository extends BaseRepository<Artist, ArtistRow> {
  protected tableName = "artists";

  protected mapRow(row: ArtistRow): Artist {
    return {
      ...row,
      image: row.image_url ? { url: row.image_url } : null,
      description: (row as any).description, // Fallback if bio is missing or different
    } as unknown as Artist;
  }


  async upsert(artist: Artist) {
    return this.transaction(async (db) => {
      await db.runAsync(
        `INSERT OR REPLACE INTO artists (
            id, name, bio, genre, version, image_url, created_at, updated_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        sanitizeParams([
          artist.id,
          artist.name,
          artist.bio || null,
          artist.genre || null,
          artist.version,
          artist.image?.url || null,
          artist.created_at,
          artist.updated_at,
          artist.deleted_at || null,
        ]),
      );
    });
  }

  async batchUpsert(artists: Artist[]) {
    return this.transaction(async (db) => {
      await db.withTransactionAsync(async () => {
        for (const artist of artists) {
          await db.runAsync(
            `INSERT OR REPLACE INTO artists (
                id, name, bio, genre, version, image_url, created_at, updated_at, deleted_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            sanitizeParams([
              artist.id,
              artist.name,
              artist.bio || null,
              artist.genre || null,
              artist.version,
              artist.image?.url || null,
              artist.created_at,
              artist.updated_at,
              artist.deleted_at || null,
            ]),
          );
        }
      });
    });
  }
}

export const artistsRepository = new ArtistsRepository();
