export interface Media {
  id: string;
  url: string;
  type: "profile_picture" | "event_banner" | "artist_image";
  mime_type?: string;
  size_bytes?: number;
  width?: number;
  height?: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  dob: string;
  bio?: string;
  is_public: boolean;
  roles: string[];
  permissions: string[];
  profile_media?: Media | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}
