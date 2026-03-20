import { User } from "./user";

export interface Group {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  owner?: User;
  members?: User[];
  members_count?: number;
  timetables?: import("./timetable").Timetable[];
  pivot?: {
    invitation_status: "pending" | "accepted" | "rejected";
    role: "admin" | "member";
  };
  created_at: string;
  updated_at: string;
}
