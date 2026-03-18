import { create } from "zustand";
import { Timetable, TimetableEntry } from "../types/timetable";
import { timetablesApi } from "../api/timetables";
import { useAuthStore } from "./useAuthStore";

interface TimetableState {
  officialTimetable: Record<string, Timetable | null>; // eventId -> timetable
  personalTimetable: Record<string, Timetable | null>; // eventId -> timetable
  groups: any[]; // User's groups
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
  viewMode: "vertical" | "horizontal";
  groupsFetched: boolean;
  isInitialized: boolean;
  
  // Actions
  fetchGroups: () => Promise<void>;
  fetchOfficial: (eventId: string) => Promise<void>;
  fetchPersonal: (eventId: string) => Promise<void>;
  createPersonal: (eventId: string, name: string) => Promise<void>;
  deletePersonal: (eventId: string, timetableId: string) => Promise<void>;
  toggleAttend: (timetableId: string, entryId: string, isGroup: boolean, eventId?: string, groupId?: string) => Promise<void>;
  setViewMode: (mode: "vertical" | "horizontal") => void;
  reset: () => void;
  acceptInvitation: (groupId: string) => Promise<void>;
  rejectInvitation: (groupId: string) => Promise<void>;
  createGroup: (name: string, user_ids: string[]) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  createGroupTimetable: (groupId: string, event_id: string, name: string) => Promise<void>;
  fetchGroupTimetable: (groupId: string, timetableId: string) => Promise<void>;
}

export const useTimetableStore = create<TimetableState>((set, get) => ({
  officialTimetable: {},
  personalTimetable: {},
  groups: [],
  loading: {},
  error: {},
  viewMode: "vertical",
  groupsFetched: false,
  isInitialized: false,

  fetchGroups: async () => {
    try {
      const res = await timetablesApi.getGroups();
      set({ groups: res.data, groupsFetched: true });
    } catch {
      console.error("Failed to fetch groups");
      set({ groupsFetched: true }); // Still mark as fetched to avoid loops
    }
  },

  fetchOfficial: async (eventId: string) => {
    set((state) => ({ 
      loading: { ...state.loading, [eventId]: true },
      error: { ...state.error, [eventId]: null }
    }));
    try {
      const res = await timetablesApi.getOfficial(eventId);
      const data = (res.data as any).data || res.data;
      set((state) => ({
        officialTimetable: { ...state.officialTimetable, [eventId]: data },
      }));
    } catch {
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
      const data = (res.data as any).data || res.data;
      set((state) => ({
        personalTimetable: { ...state.personalTimetable, [eventId]: data },
      }));
    } catch {
      // Might not exist yet, that's fine
    }
  },

  createPersonal: async (eventId: string, name: string) => {
    const tempId = `temp-${Date.now()}`;
    const tempTimetable: Timetable = { 
      id: tempId, 
      name, 
      event_id: eventId, 
      entries: get().officialTimetable[eventId]?.entries || [], // Optimistically copy official entries
      is_official: false
    };
    
    const previous = get().personalTimetable[eventId];
    set((state) => ({
      personalTimetable: { ...state.personalTimetable, [eventId]: tempTimetable },
      loading: { ...state.loading, [eventId]: true }
    }));

    try {
      const res = await timetablesApi.createPersonal({ event_id: eventId, name });
      const data = (res.data as any).data || res.data;
      set((state) => ({
        personalTimetable: { ...state.personalTimetable, [eventId]: data },
      }));
    } catch {
      set((state) => ({ 
        personalTimetable: { ...state.personalTimetable, [eventId]: previous },
        error: { ...state.error, [eventId]: "Failed to create timetable" } 
      }));
    } finally {
      set((state) => ({ loading: { ...state.loading, [eventId]: false } }));
    }
  },

  deletePersonal: async (eventId: string, timetableId: string) => {
    const previous = get().personalTimetable[eventId];
    set((state) => {
      const newPersonal = { ...state.personalTimetable };
      delete newPersonal[eventId];
      return { personalTimetable: newPersonal };
    });

    try {
      await timetablesApi.deletePersonal(timetableId);
    } catch (e) {
      console.error("Failed to delete personal timetable", e);
      set((state) => ({
        personalTimetable: { ...state.personalTimetable, [eventId]: previous }
      }));
    }
  },

  toggleAttend: async (timetableId, entryId, isGroup, eventId, groupId) => {
    const state = get();
    let timetable = isGroup 
      ? state.groups.find(g => g.id === groupId)?.timetables?.find((t: any) => t.id === timetableId)
      : (timetableId === state.officialTimetable[eventId!]?.id ? state.officialTimetable[eventId!] : state.personalTimetable[eventId!]);
    
    if (!timetable || timetable.id !== timetableId) {
       console.warn("Timetable not found for toggleAttend:", timetableId);
       return;
    }

    if (!timetable.entries || timetable.entries.length === 0) {
       console.warn("Timetable has no entries loaded, can't toggle optimally.");
       // Fallback: just call API and refetch
       try {
         await timetablesApi.toggleAttend(timetableId, entryId, isGroup, groupId);
         if (isGroup) {
            get().fetchGroupTimetable(groupId!, timetableId);
         } else if (eventId) {
            get().fetchPersonal(eventId);
         }
       } catch (e) {
         console.error("Toggle failed", e);
       }
       return;
    }

    const updateState = (updaterFn: (entries: TimetableEntry[]) => TimetableEntry[]) => {
      set((state) => {
        if (isGroup) {
          const newGroups = state.groups.map(g => {
            if (g.id === groupId) {
              const currentT = g.timetables?.find((t: any) => t.id === timetableId);
              if (!currentT) return g;
              const newEntries = updaterFn(currentT.entries || []);
              const newT = g.timetables.map((t: any) => 
                t.id === timetableId ? { ...t, entries: newEntries } : t
              );
              return { ...g, timetables: newT };
            }
            return g;
          });
          return { groups: newGroups };
        } else {
          // Re-fetch the record from the state to be sure we don't overwrite other changes
          const target = timetable.is_official ? "officialTimetable" : "personalTimetable";
          const currentDict = state[target as "officialTimetable" | "personalTimetable"];
          const currentT = currentDict[eventId!];
          if (!currentT) return state;

          const newEntries = updaterFn(currentT.entries || []);

          return {
            [target]: {
              ...currentDict,
              [eventId!]: { ...currentT, entries: newEntries },
            },
          };
        }
      });
    };

    // 1. Optimistic Update
    updateState((entries) => entries.map((e: TimetableEntry) => {
      if (e.id === entryId) {
        const wasAttending = e.pivot?.is_attending ?? false;
        const currentCount = e.pivot?.attending_count ?? 0;
        return {
          ...e,
          pivot: {
            ...e.pivot,
            is_attending: !wasAttending,
            attending_count: isGroup 
              ? (wasAttending ? Math.max(0, currentCount - 1) : currentCount + 1)
              : currentCount
          },
        };
      }
      return e;
    }));

    // 2. API Request
    try {
      const res = await timetablesApi.toggleAttend(timetableId, entryId, isGroup, groupId);
      // Update with server state to be sure (count etc)
      updateState((entries) => entries.map((e: TimetableEntry) => {
        if (e.id === entryId) {
          return {
            ...e,
            pivot: {
              ...e.pivot,
              is_attending: res.data.is_attending,
              attending_count: res.data.count ?? e.pivot?.attending_count
            },
          };
        }
        return e;
      }));
    } catch (e) {
      console.error("Failed to toggle attendance", e);
      // Rollback only the specific entry that failed
      updateState((entries) => entries.map((e: TimetableEntry) => {
        if (e.id === entryId) {
          const isAtt = e.pivot?.is_attending ?? false;
          const currentCount = e.pivot?.attending_count ?? 0;
          return {
            ...e,
            pivot: {
              ...e.pivot,
              is_attending: !isAtt,
              attending_count: isGroup 
                ? (isAtt ? Math.max(0, currentCount - 1) : currentCount + 1)
                : currentCount
            },
          };
        }
        return e;
      }));
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
    const tempId = `temp-g-${Date.now()}`;
    const tempGroup = { 
      id: tempId, 
      name, 
      owner_id: useAuthStore.getState().user?.id,
      pivot: { invitation_status: 'accepted' },
      timetables: []
    };
    
    const previousGroups = get().groups;
    set((state) => ({ groups: [...state.groups, tempGroup] }));

    try {
      const res = await timetablesApi.createGroup({ name, user_ids });
      const resData = (res.data as any).data || res.data;
      // Replace temp with real
      set((state) => ({
        groups: state.groups.map(g => g.id === tempId ? resData : g)
      }));
    } catch (e) {
      console.error("Failed to create group", e);
      set({ groups: previousGroups });
      throw e;
    }
  },

  deleteGroup: async (groupId: string) => {
    const previousGroups = get().groups;
    set((state) => ({
      groups: state.groups.filter(g => g.id !== groupId)
    }));

    try {
      await timetablesApi.deleteGroup(groupId);
      // Backend handles "Leave" vs "Delete" internally
    } catch (e) {
      console.error("Failed to delete group", e);
      set({ groups: previousGroups });
    }
  },

  createGroupTimetable: async (groupId: string, eventId: string, name: string) => {
    const tempId = `temp-${Date.now()}`;
    const officialEntries = get().officialTimetable[eventId]?.entries || [];
    const tempT: Timetable = {
      id: tempId,
      name,
      event_id: eventId,
      entries: officialEntries,
      is_official: false
    };

    const previousGroups = get().groups;
    set((state) => ({
      groups: state.groups.map(g => {
        if (g.id === groupId) {
          return { ...g, timetables: [...(g.timetables || []), tempT] };
        }
        return g;
      })
    }));

    try {
      const res = await timetablesApi.createGroupTimetable(groupId, { event_id: eventId, name });
      const resData = (res.data as any).data || res.data;
      // Replace temp with real
      set((state) => ({
        groups: state.groups.map(g => {
          if (g.id === groupId) {
            return { 
              ...g, 
              timetables: g.timetables.map((t: any) => t.id === tempId ? resData : t) 
            };
          }
          return g;
        })
      }));
    } catch (e) {
      console.error("Failed to create group timetable", e);
      set({ groups: previousGroups });
      throw e;
    }
  },

  fetchGroupTimetable: async (groupId: string, timetableId: string) => {
    try {
      // Re-use an existing API or just fetch group timetables
      const res = await timetablesApi.getGroupTimetables(groupId);
      const timetable = res.data.find((t: any) => t.id === timetableId);
      if (timetable) {
        set((state) => ({
          groups: state.groups.map(g => {
            if (g.id === groupId) {
              return { 
                ...g, 
                timetables: (g.timetables || []).map((t: any) => t.id === timetableId ? timetable : t)
              };
            }
            return g;
          })
        }));
      }
    } catch (e) {
      console.error("Failed to fetch group timetable detail", e);
    }
  },

  setViewMode: (viewMode) => set({ viewMode }),

  reset: () => {
    set({
      groups: [],
      groupsFetched: false,
      isInitialized: false,
      loading: {},
      error: {},
    });
  },
}));
