import { create } from "zustand";
import { Timetable, TimetableEntry } from "../types/timetable";
import { timetablesApi } from "../api/timetables";

interface TimetableState {
  officialTimetable: Record<string, Timetable | null>; // eventId -> timetable
  personalTimetable: Record<string, Timetable | null>; // eventId -> timetable
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
  viewMode: "vertical" | "horizontal";
  
  // Actions
  fetchOfficial: (eventId: string) => Promise<void>;
  fetchPersonal: (eventId: string) => Promise<void>;
  createPersonal: (eventId: string, name: string, officialEntries?: TimetableEntry[]) => Promise<void>;
  toggleEntry: (timetableId: string, entryId: string, isPersonal: boolean, eventId: string) => Promise<void>;
  setViewMode: (mode: "vertical" | "horizontal") => void;
}

export const useTimetableStore = create<TimetableState>((set, get) => ({
  officialTimetable: {},
  personalTimetable: {},
  loading: {},
  error: {},
  viewMode: "vertical",

  fetchOfficial: async (eventId: string) => {
    set((state) => ({ 
      loading: { ...state.loading, [eventId]: true },
      error: { ...state.error, [eventId]: null }
    }));
    try {
      const res = await timetablesApi.getOfficial(eventId);
      set((state) => ({
        officialTimetable: { ...state.officialTimetable, [eventId]: res.data },
      }));
    } catch (e) {
      set((state) => ({ 
        error: { ...state.error, [eventId]: "Official timetable not available yet." }
      }));
    } finally {
      set((state) => ({ 
        loading: { ...state.loading, [eventId]: false }
      }));
    }
  },

  fetchPersonal: async (eventId: string) => {
    try {
      const res = await timetablesApi.getPersonal(eventId);
      set((state) => ({
        personalTimetable: { ...state.personalTimetable, [eventId]: res.data },
      }));
    } catch (e) {
      // Might not exist yet, that's fine
    }
  },

  createPersonal: async (eventId: string, name: string, officialEntries = []) => {
    set((state) => ({ loading: { ...state.loading, [eventId]: true } }));
    try {
      // 1. Create the personal timetable
      const res = await timetablesApi.createPersonal({ event_id: eventId, name });
      const timetable = res.data;

      // 2. If we have official entries to duplicate, do it now
      if (officialEntries.length > 0) {
        const entryIds = officialEntries.map(e => e.id);
        const updatedRes = await timetablesApi.updateEntries(timetable.id, entryIds);
        set((state) => ({
          personalTimetable: { ...state.personalTimetable, [eventId]: updatedRes.data },
        }));
      } else {
        set((state) => ({
          personalTimetable: { ...state.personalTimetable, [eventId]: timetable },
        }));
      }
    } catch (e) {
      set((state) => ({ error: { ...state.error, [eventId]: "Failed to create timetable" } }));
    } finally {
      set((state) => ({ loading: { ...state.loading, [eventId]: false } }));
    }
  },

  toggleEntry: async (timetableId, entryId, isPersonal, eventId) => {
    const state = get();
    const currentTimetable = isPersonal 
      ? state.personalTimetable[eventId] 
      : null; // Official is read-only for now in this context

    if (!currentTimetable) return;

    let newEntryIds: string[];
    const isAlreadyMember = currentTimetable.entries.some(e => e.id === entryId);

    if (isAlreadyMember) {
      newEntryIds = currentTimetable.entries.filter(e => e.id !== entryId).map(e => e.id);
    } else {
      newEntryIds = [...currentTimetable.entries.map(e => e.id), entryId];
    }

    // Optimistic update
    // Note: We'd need the full entry object to properly update locally without re-fetch
    // For now, let's just do the API call and refresh or handle it carefully
    try {
      const res = await timetablesApi.updateEntries(timetableId, newEntryIds);
      set((state) => ({
        personalTimetable: { ...state.personalTimetable, [eventId]: res.data },
      }));
    } catch (e) {
      console.error("Failed to toggle entry", e);
    }
  },

  setViewMode: (viewMode) => set({ viewMode }),
}));
