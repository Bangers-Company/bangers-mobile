import { create } from "zustand";
import { Group } from "../types/group";
import { timetablesApi } from "../api/timetables";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface TimetableState {
  groups: Group[]; // User's groups
  viewMode: "vertical" | "horizontal";
  groupsFetched: boolean;
  
  // Actions
  fetchGroups: () => Promise<void>;
  setViewMode: (mode: "vertical" | "horizontal") => void;
  reset: () => void;
  acceptInvitation: (groupId: string) => Promise<void>;
  rejectInvitation: (groupId: string) => Promise<void>;
  createGroup: (name: string, user_ids: string[]) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  createGroupTimetable: (groupId: string, event_id: string, name: string) => Promise<void>;
}

export const useTimetableStore = create<TimetableState>()(
  persist(
    (set, get) => ({
  groups: [],
  viewMode: "vertical",
  groupsFetched: false,

  fetchGroups: async () => {
    try {
      const res = await timetablesApi.getGroups();
      set({ groups: res.data, groupsFetched: true });
    } catch {
      console.error("Failed to fetch groups");
      set({ groupsFetched: true });
    }
  },

  acceptInvitation: async (groupId: string) => {
    try {
      await timetablesApi.acceptInvitation(groupId);
      get().fetchGroups();
    } catch (e) {
      console.error("Failed to accept invitation", e);
    }
  },

  rejectInvitation: async (groupId: string) => {
    try {
      await timetablesApi.rejectInvitation(groupId);
      get().fetchGroups();
    } catch (e) {
      console.error("Failed to reject invitation", e);
    }
  },

  createGroup: async (name: string, user_ids: string[]) => {
    try {
      await timetablesApi.createGroup({ name, user_ids });
      await get().fetchGroups();
    } catch (e) {
      console.error("Failed to create group", e);
      throw e;
    }
  },

  deleteGroup: async (groupId: string) => {
    try {
      await timetablesApi.deleteGroup(groupId);
      await get().fetchGroups();
    } catch (e) {
      console.error("Failed to delete group", e);
    }
  },

  createGroupTimetable: async (groupId: string, eventId: string, name: string) => {
    try {
      await timetablesApi.createGroupTimetable(groupId, { event_id: eventId, name });
      await get().fetchGroups();
    } catch (e) {
      console.error("Failed to create group timetable", e);
      throw e;
    }
  },

  setViewMode: (viewMode) => set({ viewMode }),

  reset: () => {
    set({
      groups: [],
      groupsFetched: false,
    });
  },
    }),
    {
      name: "timetable-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        viewMode: state.viewMode,
      }),
    }
  )
);
