import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, UserStats } from '../../types/user';
import { Event } from '../../types/event';
import { userApi } from '../../api/user';
import { friendsApi } from '../../api/friends';
import { setAttendanceStatus } from './eventSlice';
import { toggleAttendance } from './timetableSlice';

interface UserState {
  user: User | null;
  attendingEvents: Event[];
  pastEvents: Event[];
  friendsCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  attendingEvents: [],
  pastEvents: [],
  friendsCount: 0,
  loading: false,
  error: null,
};

export const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const [response, friendsRes] = await Promise.all([
        userApi.getMe(),
        friendsApi.getFriends()
      ]);
      
      const userData = (response as any).data.data || (response as any).data;
      const friendsResData = friendsRes?.data?.data || friendsRes?.data || [];

      if (!userData) {
        throw new Error("User data not found in response");
      }

      const attending = userData.upcoming_events?.data || userData.upcoming_events || [];
      const past = userData.past_events?.data || userData.past_events || [];
      
      // Prioritize API-data counters if available
      const friendsCount = userData.friends_count ?? friendsResData.length;
      
      const stats: UserStats = {
        upcoming_count: attending.length,
        past_count: past.length,
      };

      return {
        user: { ...userData, stats, friends_count: friendsCount },
        attendingEvents: attending,
        pastEvents: past,
        friendsCount: friendsCount,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch profile');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateFriendsCount: (state, action: PayloadAction<number>) => {
      state.friendsCount += action.payload;
      if (state.user) {
        state.user.friends_count = state.friendsCount;
      }
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      state.attendingEvents = [];
      state.pastEvents = [];
      state.friendsCount = 0;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.attendingEvents = action.payload.attendingEvents;
      state.pastEvents = action.payload.pastEvents;
      state.friendsCount = action.payload.friendsCount;
    });
    builder.addCase(fetchProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Cross-slice synchronization for attendance
    builder.addCase(setAttendanceStatus, (state, action) => {
      if (!state.user || !state.user.stats) return;
      
      const { id, status, event } = action.payload;
      const isCurrentlyAttending = state.attendingEvents.some(e => e.id === id);
      
      if (status === 'going' && !isCurrentlyAttending) {
        state.user.stats.upcoming_count++;
        if (event) {
          state.attendingEvents.push(event);
        }
      } else if (status !== 'going' && isCurrentlyAttending) {
        state.user.stats.upcoming_count = Math.max(0, state.user.stats.upcoming_count - 1);
        state.attendingEvents = state.attendingEvents.filter(e => e.id !== id);
      }
    });
    
    // Sync from timetable actions
    builder.addCase(toggleAttendance.pending, (state, action) => {
      if (!state.user || !state.user.stats) return;
      
      // If they toggle on a personal/official timetable, it likely affects their attendance
      // For now, we'll just ensure the counter is consistent.
      // This is a bit speculative without the event object, but better than nothing.
    });
  },
});

export const { updateFriendsCount, setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
