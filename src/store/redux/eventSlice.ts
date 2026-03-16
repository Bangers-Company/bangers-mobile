import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Event } from '../../types/event';
import { User } from '../../types/user';
import { eventsApi } from '../../api/events';

interface EventCache {
  event: Event;
  attendees: User[];
  isFullyLoaded: boolean;
  lastFetched: number;
}

interface EventState {
  events: Record<string, EventCache>;
  loadingEvents: Record<string, boolean>;
  errors: Record<string, string | null>;
}

const initialState: EventState = {
  events: {},
  loadingEvents: {},
  errors: {},
};

export const fetchFullEvent = createAsyncThunk(
  'event/fetchFull',
  async ({ id, force = false, signal }: { id: string; force?: boolean; signal?: AbortSignal }, { getState, rejectWithValue }) => {
    const state = (getState() as any).event as EventState;
    const cached = state.events[id];
    const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

    if (!force && cached?.isFullyLoaded && Date.now() - cached.lastFetched < CACHE_TTL) {
      return null;
    }

    try {
      const eventRes = await eventsApi.getById(id, { signal });
      const fetchedEvent = (eventRes.data as any).data || eventRes.data;
      const fetchedAttendees = fetchedEvent.attendees || [];
      const visibleAttendees = fetchedAttendees.filter((u: User) => u.is_public !== false);

      return {
        id,
        event: fetchedEvent,
        attendees: visibleAttendees,
      };
    } catch (error: any) {
      if (error.name === 'CanceledError') return null;
      return rejectWithValue(error.message || 'Failed to load event data');
    }
  }
);

const eventSlice = createSlice({
  name: 'event',
  initialState,
  reducers: {
    setEventData: (state, action: PayloadAction<Event>) => {
      const event = action.payload;
      state.events[event.id] = {
        event: { ...(state.events[event.id]?.event || {}), ...event },
        attendees: state.events[event.id]?.attendees || [],
        isFullyLoaded: state.events[event.id]?.isFullyLoaded || false,
        lastFetched: state.events[event.id]?.lastFetched || Date.now(),
      };
    },
    setEventsData: (state, action: PayloadAction<Event[]>) => {
      action.payload.forEach((event) => {
        state.events[event.id] = {
          event: { ...(state.events[event.id]?.event || {}), ...event },
          attendees: state.events[event.id]?.attendees || [],
          isFullyLoaded: state.events[event.id]?.isFullyLoaded || false,
          lastFetched: state.events[event.id]?.lastFetched || Date.now(),
        };
      });
    },
    setAttendanceStatus: (state, action: PayloadAction<{ id: string; status: 'going' | 'interested' | null; currentUser: User; event?: Event }>) => {
      const { id, status, currentUser, event } = action.payload;
      const cached = state.events[id];
      if (!cached) return;

      const previousStatus = cached.event.user_status;
      let newAttendeeCount = cached.event.attendee_count ?? cached.attendees.length;

      if (status === "going" && previousStatus !== "going") {
        newAttendeeCount++;
      } else if (status !== "going" && previousStatus === "going") {
        newAttendeeCount = Math.max(0, newAttendeeCount - 1);
      }

      let newAttendees = [...cached.attendees];
      if (status !== null) {
        if (!newAttendees.some(a => a.id === currentUser.id)) {
          newAttendees.push(currentUser);
        }
      } else {
        newAttendees = newAttendees.filter(a => a.id !== currentUser.id);
      }

      state.events[id] = {
        ...cached,
        event: {
          ...cached.event,
          ...(event || {}),
          user_status: status,
          attendee_count: newAttendeeCount
        },
        attendees: newAttendees,
      };
    },
    clearError: (state, action: PayloadAction<string>) => {
      state.errors[action.payload] = null;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchFullEvent.pending, (state, action) => {
      const { id } = action.meta.arg;
      state.loadingEvents[id] = true;
      state.errors[id] = null;
    });
    builder.addCase(fetchFullEvent.fulfilled, (state, action) => {
      if (!action.payload) return;
      const { id, event, attendees } = action.payload;
      state.events[id] = {
        event,
        attendees,
        isFullyLoaded: true,
        lastFetched: Date.now(),
      };
      state.loadingEvents[id] = false;
    });
    builder.addCase(fetchFullEvent.rejected, (state, action) => {
      const { id } = action.meta.arg;
      state.errors[id] = action.payload as string;
      state.loadingEvents[id] = false;
    });
  }
});

export const { setEventData, setEventsData, setAttendanceStatus, clearError } = eventSlice.actions;
export default eventSlice.reducer;
