export interface AppNotification {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: string;
  data: {
    type: 'FRIEND_REQUEST' | 'FRIEND_REQUEST_ACCEPTED' | 'GROUP_INVITATION' | 'GROUP_INVITATION_ACCEPTED' | string;
    title?: string;
    message?: string;
    requester_id?: string;
    requester_username?: string;
    acceptor_id?: string;
    acceptor_username?: string;
    group_id?: string;
    group_name?: string;
    inviter_id?: string;
    member_id?: string;
  };
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationsResponse {
  unread_count: number;
  data: AppNotification[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
