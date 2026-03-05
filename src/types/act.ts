import { Artist } from "./artist";

export interface Act {
  id: string;
  name: string;
  description?: string;
  version: number;
  stage_id?: string;
  date?: string;
  artists?: Artist[];
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}
