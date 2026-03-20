import { Media, User } from "./user";
import { Artist } from "./artist";
import { Act as BaseAct } from "./act";

export interface Stage {
  id: string;
  name: string;
  description?: string;
  version: number;
  event_id?: string;
  created_at: string;
  updated_at: string;
}

export { Artist };

export interface Act extends BaseAct {
  stage_id?: string;
  date?: string;
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
  user_status?: "going" | "interested" | null;
  official_timetable?: { id: string; name: string } | null;
  personal_timetable?: { id: string; name: string } | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface SyncResponse<T> {
  data: T[];
  sync_timestamp: string;
}
