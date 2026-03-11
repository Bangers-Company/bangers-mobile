import { Media, User } from "./user";

export interface Stage {
  id: string;
  name: string;
  description?: string;
  version: number;
  event_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  genre?: string;
  image?: Media | null;
}

export interface Act {
  id: string;
  name: string;
  description?: string;
  version: number;
  stage_id?: string;
  date?: string;
  artists?: Artist[];
  start_time?: string;
  end_time?: string;
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
  acts?: Act[];
  attendees?: User[];
  attendee_count?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface SyncResponse<T> {
  data: T[];
  sync_timestamp: string;
}
