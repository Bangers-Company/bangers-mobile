import { create } from "zustand";
import { Group } from "../types/group";
import { timetablesApi } from "../api/timetables";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface TimetableState {
  groups: Group[]; // User's groups
  viewMode: "vertical" | "horizontal";
  groupsFetched: boolean;
  selectedDay: string;
  availableDays: string[];
  
  // Actions
  fetchGroups: () => Promise<void>;
  setViewMode: (mode: "vertical" | "horizontal") => void;
  setSelectedDay: (day: string) => void;
  setAvailableDays: (days: string[]) => void;
  reset: () => void;
  acceptInvitation: (groupId: string) => Promise<void>;
  rejectInvitation: (groupId: string) => Promise<void>;
  createGroup: (name: string, user_ids: string[], eventId?: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  createGroupTimetable: (groupId: string, event_id: string, name: string) => Promise<void>;
}

export const useTimetableStore = create<TimetableState>()(
  persist(
    (set, get) => ({
      groups: [],
      viewMode: "vertical",
      groupsFetched: false,
      selectedDay: "",
      availableDays: [],

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
        const previousGroups = get().groups;
        set({
          groups: previousGroups.map(g => 
            g.id === groupId 
              ? { ...g, pivot: g.pivot ? { ...g.pivot, invitation_status: 'accepted' } : { invitation_status: 'accepted', role: 'member' } } as Group 
              : g
          )
        });

        try {
          await timetablesApi.acceptInvitation(groupId);
          await get().fetchGroups();
        } catch (e) {
          console.error("Failed to accept invitation", e);
          set({ groups: previousGroups });
        }
      },

      rejectInvitation: async (groupId: string) => {
        const previousGroups = get().groups;
        set({
          groups: previousGroups.filter(g => g.id !== groupId)
        });

        try {
          await timetablesApi.rejectInvitation(groupId);
        } catch (e) {
          console.error("Failed to reject invitation", e);
          set({ groups: previousGroups });
        }
      },

      createGroup: async (name: string, user_ids: string[], eventId?: string) => {
        try {
          await timetablesApi.createGroup({ name, user_ids, event_id: eventId });
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
      setSelectedDay: (selectedDay) => {
        if (get().selectedDay !== selectedDay) {
          set({ selectedDay });
        }
      },
      setAvailableDays: (availableDays) => {
        const current = get().availableDays;
        if (current.length !== availableDays.length || current.some((d, i) => d !== availableDays[i])) {
          set({ availableDays });
        }
      },

      reset: () => {
        set({
          groups: [],
          groupsFetched: false,
          selectedDay: "",
          availableDays: [],
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
