export interface EventRow {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  version: number;
  banner_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ArtistRow {
  id: string;
  name: string;
  bio: string | null;
  genre: string | null;
  version: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ActRow {
  id: string;
  name: string;
  description: string | null;
  version: number;
  stage_id: string | null;
  date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TimetableRow {
  id: string;
  event_id: string;
  name: string;
  is_official: number;
  is_public: number;
}

export interface TimetableEntryRow {
  id: string;
  timetable_id: string;
  act_id: string;
  stage_id: string;
  start_time: string;
  end_time: string;
}

export interface ActArtistRow {
  act_id: string;
  artist_id: string;
}

export interface AttendanceRow {
  event_id: string;
  status: string;
  updated_at: string;
}

export interface JoinedEventRow extends EventRow {
  status?: string | null;
}

export interface JoinedTimetableEntryRow extends TimetableEntryRow {
  act_name: string;
  stage_name: string;
}

export interface JoinedTimetableRow extends TimetableRow {
  entry_id: string | null;
  start_time: string | null;
  end_time: string | null;
  act_id: string | null;
  act_name: string | null;
  stage_id: string | null;
  stage_name: string | null;
}
