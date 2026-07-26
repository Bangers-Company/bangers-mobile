import { Media } from "./user";

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  genre?: string;
  version: number;
  image?: Media | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}
