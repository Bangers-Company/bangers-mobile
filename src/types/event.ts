import { Media } from "./user";

export interface Stage {
  id: string;
  name: string;
  description?: string;
  version: number;
  event_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  version: number;
  banner?: Media | null;
  stages?: Stage[];
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface SyncResponse<T> {
  data: T[];
  sync_timestamp: string;
}
