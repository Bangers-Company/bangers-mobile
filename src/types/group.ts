import { User } from "./user";

export interface Group {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  members?: User[];
  created_at: string;
  updated_at: string;
}
