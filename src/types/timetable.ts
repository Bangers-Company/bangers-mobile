import { Act } from "./act";
import { Stage } from "./event";

export interface TimetableEntry {
  id: string;
  start_time: string;
  end_time: string;
  act: Act;
  stage: Stage;
  pivot?: {
    is_attending?: boolean;
    added_by?: string;
    attending_count?: number;
  };
  is_attending?: boolean;
  attendees?: import("./user").User[];
}

export interface Timetable {
  id: string;
  user_id?: string;
  event_id: string;
  name: string;
  is_official?: boolean;
  is_public?: boolean;
  entries: TimetableEntry[];
}
