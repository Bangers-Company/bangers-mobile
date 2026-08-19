export interface Media {
  id: string;
  url: string;
  type: "profile_picture" | "event_banner" | "artist_image";
  mime_type?: string;
  size_bytes?: number;
  width?: number;
  height?: number;
}

export interface UserStats {
  upcoming_count: number;
  past_count: number;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  name?: string | null; // fallback if no full_name
  dob: string;
  bio?: string;
  last_login_at?: string | null;
  is_public: boolean;
  genres?: Genre[];
  roles: string[];
  permissions: string[];
  profile_media?: Media | null;
  profile_media_url?: string | null;
  profile_photo_url?: string | null;
  friends_count?: number;
  friend_requests?: import("../api/friends").Friendship[];
  stats?: UserStats;
  past_events?: import("./event").Event[];
  upcoming_events?: import("./event").Event[];
  attendingEvents?: import("./event").Event[];
  pastEvents?: import("./event").Event[];
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}
