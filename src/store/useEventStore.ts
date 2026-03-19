import { create } from "zustand";
import { Event } from "../types/event";
import { User } from "../types/user";
import { eventsApi } from "../api/events";

interface EventCache {
  event: Event;
  attendees: User[];
  isFullyLoaded: boolean;
  lastFetched: number;
}

interface EventStore {
  events: Record<string, EventCache>;
  loadingEvents: Record<string, boolean>;
  errors: Record<string, string | null>;
  
  // Set partial or full event data (e.g., from Dashboard)
  setEventData: (event: Event) => void;
  setEventsData: (events: Event[]) => void;
  
  // Fetch full details and attendees for the event page
  fetchFullEvent: (id: string, force?: boolean) => Promise<void>;
  
  // Clear error
  clearError: (id: string) => void;
  
  // Optimistic updates
  setAttendanceStatus: (id: string, status: "going" | "interested" | null, currentUser: User) => void;
}

const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export const useEventStore = create<EventStore>((set, get) => ({
  events: {},
  loadingEvents: {},
  errors: {},

  setEventData: (event) => {
    set((state) => ({
      events: {
        ...state.events,
        [event.id]: {
          event: { ...(state.events[event.id]?.event || {}), ...event },
          attendees: state.events[event.id]?.attendees || [],
          isFullyLoaded: state.events[event.id]?.isFullyLoaded || false,
          lastFetched: state.events[event.id]?.lastFetched || Date.now(),
        },
      },
    }));
  },

  setEventsData: (events) => {
    set((state) => {
      const newEvents = { ...state.events };
      events.forEach((event) => {
        newEvents[event.id] = {
          event: { ...(newEvents[event.id]?.event || {}), ...event },
          attendees: newEvents[event.id]?.attendees || [],
          isFullyLoaded: newEvents[event.id]?.isFullyLoaded || false,
          lastFetched: newEvents[event.id]?.lastFetched || Date.now(),
        };
      });
      return { events: newEvents };
    });
  },

  fetchFullEvent: async (id, force = false) => {
    const state = get();
    const cached = state.events[id];
    
    // If it's already fully loaded and cache hasn't expired, skip fetch
    if (!force && cached?.isFullyLoaded && Date.now() - cached.lastFetched < CACHE_TTL) {
      return;
    }

    set((state) => ({ loadingEvents: { ...state.loadingEvents, [id]: true }, errors: { ...state.errors, [id]: null } }));

    try {
      const eventRes = await eventsApi.getById(id);

      const fetchedEvent = eventRes.data;
      const fetchedAttendees = fetchedEvent.attendees || [];

      // Filter public attendees
      const visibleAttendees = fetchedAttendees.filter((u: User) => u.is_public !== false);

      set((state) => ({
        events: {
          ...state.events,
          [id]: {
            event: fetchedEvent,
            attendees: visibleAttendees,
            isFullyLoaded: true,
            lastFetched: Date.now(),
          },
        },
        loadingEvents: { ...state.loadingEvents, [id]: false },
      }));
    } catch (error: any) {
      set((state) => ({
        errors: { ...state.errors, [id]: error.message || "Failed to load event data" },
        loadingEvents: { ...state.loadingEvents, [id]: false },
      }));
    }
  },

  clearError: (id) => {
    set((state) => ({ errors: { ...state.errors, [id]: null } }));
  },

  setAttendanceStatus: (id, status, currentUser) => {
    set((state) => {
      const cached = state.events[id];
      if (!cached) return state;

      const previousStatus = cached.event.user_status;
      let newAttendeeCount = cached.event.attendee_count ?? cached.attendees.length;

      // Optimistic count update
      if (status === "going" && previousStatus !== "going") {
        newAttendeeCount++;
      } else if (status !== "going" && previousStatus === "going") {
        newAttendeeCount = Math.max(0, newAttendeeCount - 1);
      }

      let newAttendees = [...cached.attendees];
      const isAttendingAtAll = status !== null;
      
      if (isAttendingAtAll) {
        // Add current user to attendees if not present
        if (!newAttendees.some(a => a.id === currentUser.id)) {
          newAttendees.push(currentUser);
        }
      } else {
        // Remove current user from attendees
        newAttendees = newAttendees.filter(a => a.id !== currentUser.id);
      }

      return {
        events: {
          ...state.events,
          [id]: {
            ...cached,
            event: {
              ...cached.event,
              user_status: status,
              attendee_count: newAttendeeCount
            },
            attendees: newAttendees,
          },
        },
      };
    });
  },
}));
