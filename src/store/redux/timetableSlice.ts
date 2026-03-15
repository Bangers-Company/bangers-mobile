import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Timetable, TimetableEntry } from '../../types/timetable';
import { timetablesApi } from '../../api/timetables';

interface TimetableState {
  official: Record<string, Timetable | null>; // eventId -> Timetable
  personal: Record<string, Timetable | null>; // eventId -> Timetable
  groups: Record<string, Timetable | null>;   // groupId -> Timetable
  groupsList: any[];
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
}

const initialState: TimetableState = {
  official: {},
  personal: {},
  groups: {},
  groupsList: [],
  loading: {},
  error: {},
};

export const fetchOfficialTimetable = createAsyncThunk(
  'timetable/fetchOfficial',
  async (eventId: string) => {
    const res = await timetablesApi.getOfficial(eventId);
    // If backend returns { data: Timetable }, use res.data.data, else use res.data
    const data = (res.data as any).data || res.data;
    return { eventId, data: data as Timetable };
  }
);

export const fetchPersonalTimetable = createAsyncThunk(
  'timetable/fetchPersonal',
  async (eventId: string) => {
    const res = await timetablesApi.getPersonal(eventId);
    const data = (res.data as any).data || res.data;
    return { eventId, data: data as Timetable };
  }
);

export const fetchGroupTimetable = createAsyncThunk(
  'timetable/fetchGroup',
  async (groupId: string) => {
    const res = await timetablesApi.getGroupTimetables(groupId);
    // getGroupTimetables returns Timetable[]
    const data = Array.isArray(res.data) ? res.data[0] : (res.data as any).data || res.data;
    return { groupId, data: data as Timetable };
  }
);

export const fetchGroupsList = createAsyncThunk(
  'timetable/fetchGroupsList',
  async () => {
    const res = await timetablesApi.getGroups();
    return res.data;
  }
);

export const createPersonalTimetable = createAsyncThunk(
  'timetable/createPersonal',
  async (payload: { eventId: string; name: string }) => {
    const res = await timetablesApi.createPersonal({ event_id: payload.eventId, name: payload.name });
    const data = (res.data as any).data || res.data;
    return { eventId: payload.eventId, data: data as Timetable };
  }
);

export const createGroupAction = createAsyncThunk(
  'timetable/createGroup',
  async (payload: { name: string; members: string[] }) => {
    const res = await timetablesApi.createGroup({ name: payload.name, user_ids: payload.members });
    return res.data;
  }
);

export const createGroupTimetableAction = createAsyncThunk(
  'timetable/createGroupTimetable',
  async (payload: { groupId: string; eventId: string; name: string }) => {
    const res = await timetablesApi.createGroupTimetable(payload.groupId, { event_id: payload.eventId, name: payload.name });
    const data = (res.data as any).data || res.data;
    return { groupId: payload.groupId, data: data as Timetable };
  }
);

interface ToggleAttendancePayload {
  timetableId: string;
  entryId: string;
  isGroup: boolean;
  type: 'official' | 'personal' | 'group';
  targetId: string; // eventId for official/personal, groupId for group
}

export const toggleAttendance = createAsyncThunk(
  'timetable/toggleAttendance',
  async (payload: ToggleAttendancePayload, { rejectWithValue }) => {
    try {
      await timetablesApi.toggleAttend(
        payload.timetableId,
        payload.entryId,
        payload.isGroup,
        payload.type === 'group' ? payload.targetId : undefined
      );
      return payload;
    } catch (error: any) {
      return rejectWithValue({ ...payload, error: error.message });
    }
  }
);

const timetableSlice = createSlice({
  name: 'timetable',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Official
    builder.addCase(fetchOfficialTimetable.pending, (state, action) => {
      state.loading[`official_${action.meta.arg}`] = true;
    });
    builder.addCase(fetchOfficialTimetable.fulfilled, (state, action) => {
      state.loading[`official_${action.payload.eventId}`] = false;
      state.official[action.payload.eventId] = action.payload.data;
    });
    builder.addCase(fetchOfficialTimetable.rejected, (state, action) => {
      state.loading[`official_${action.meta.arg}`] = false;
      state.error[`official_${action.meta.arg}`] = action.error.message || 'Failed to fetch official timetable';
    });

    // Personal
    builder.addCase(fetchPersonalTimetable.pending, (state, action) => {
      state.loading[`personal_${action.meta.arg}`] = true;
    });
    builder.addCase(fetchPersonalTimetable.fulfilled, (state, action) => {
      state.loading[`personal_${action.payload.eventId}`] = false;
      state.personal[action.payload.eventId] = action.payload.data;
    });
    builder.addCase(fetchPersonalTimetable.rejected, (state, action) => {
      state.loading[`personal_${action.meta.arg}`] = false;
      state.error[`personal_${action.meta.arg}`] = action.error.message || 'Failed to fetch personal timetable';
    });

    // Group
    builder.addCase(fetchGroupTimetable.pending, (state, action) => {
      state.loading[`group_${action.meta.arg}`] = true;
    });
    builder.addCase(fetchGroupTimetable.fulfilled, (state, action) => {
      state.loading[`group_${action.payload.groupId}`] = false;
      state.groups[action.payload.groupId] = action.payload.data;
    });
    builder.addCase(fetchGroupTimetable.rejected, (state, action) => {
      state.loading[`group_${action.meta.arg}`] = false;
      state.error[`group_${action.meta.arg}`] = action.error.message || 'Failed to fetch group timetable';
    });

    // Groups List
    builder.addCase(fetchGroupsList.pending, (state) => {
      state.loading['groupsList'] = true;
    });
    builder.addCase(fetchGroupsList.fulfilled, (state, action) => {
      state.loading['groupsList'] = false;
      state.groupsList = action.payload;
    });
    builder.addCase(fetchGroupsList.rejected, (state, action) => {
      state.loading['groupsList'] = false;
      state.error['groupsList'] = action.error.message || 'Failed to fetch groups';
    });

    // Create Personal
    builder.addCase(createPersonalTimetable.fulfilled, (state, action) => {
      state.personal[action.payload.eventId] = action.payload.data;
      // Also update loading state if we want to be clean
      state.loading[`personal_${action.payload.eventId}`] = false;
    });

    // Create Group
    builder.addCase(createGroupAction.fulfilled, (state, action) => {
      state.groupsList.push(action.payload);
    });

    // Create Group Timetable
    builder.addCase(createGroupTimetableAction.fulfilled, (state, action) => {
      const { groupId, data } = action.payload;
      state.groupsList = state.groupsList.map(group => {
        if (String(group.id) === String(groupId)) {
          return {
            ...group,
            timetables: [...(group.timetables || []), data]
          };
        }
        return group;
      });
      state.groups[groupId] = data;
    });

    // Optimistic Toggle Attendance
    builder.addCase(toggleAttendance.pending, (state, action) => {
      const { entryId, type, targetId, isGroup, timetableId } = action.meta.arg;
      const targetTimetable = 
        type === 'official' ? state.official[targetId] :
        type === 'personal' ? state.personal[targetId] :
        state.groups[targetId];

      if (targetTimetable && targetTimetable.entries) {
        const newEntries = (targetTimetable.entries as TimetableEntry[]).map(entry => {
          if (String(entry.id) === String(entryId)) {
            const wasAttending = entry.pivot?.is_attending ?? false;
            const currentCount = entry.pivot?.attending_count ?? 0;
            return {
              ...entry,
              pivot: {
                ...entry.pivot,
                is_attending: !wasAttending,
                attending_count: isGroup
                  ? (wasAttending ? Math.max(0, currentCount - 1) : currentCount + 1)
                  : currentCount
              }
            };
          }
          return entry;
        });

        const newTimetable = { ...targetTimetable, entries: newEntries };
        if (type === 'official') state.official[targetId] = newTimetable;
        else if (type === 'personal') state.personal[targetId] = newTimetable;
        else if (type === 'group') state.groups[targetId] = newTimetable;
      }

      // ALSO update groupsList if this is a group toggle
      if (type === 'group') {
        state.groupsList = state.groupsList.map(group => {
          if (String(group.id) === String(targetId) && group.timetables) {
            return {
              ...group,
              timetables: group.timetables.map((t: any) => {
                if (String(t.id) === String(timetableId) && t.entries) {
                  return {
                    ...t,
                    entries: t.entries.map((entry: TimetableEntry) => {
                      if (String(entry.id) === String(entryId)) {
                        const wasAttending = entry.pivot?.is_attending ?? false;
                        const currentCount = entry.pivot?.attending_count ?? 0;
                        return {
                          ...entry,
                          pivot: {
                            ...entry.pivot,
                            is_attending: !wasAttending,
                            attending_count: wasAttending ? Math.max(0, currentCount - 1) : currentCount + 1
                          }
                        };
                      }
                      return entry;
                    })
                  };
                }
                return t;
              })
            };
          }
          return group;
        });
      }
    });

    builder.addCase(toggleAttendance.rejected, (state, action: any) => {
      // Rollback on error
      const payload = action.payload || action.meta.arg; // Fallback to arg if rejectWithValue failed
      const { entryId, type, targetId, isGroup, timetableId } = payload;
      
      const targetTimetable = 
        type === 'official' ? state.official[targetId] :
        type === 'personal' ? state.personal[targetId] :
        state.groups[targetId];

      if (targetTimetable && targetTimetable.entries) {
        const newEntries = (targetTimetable.entries as TimetableEntry[]).map(entry => {
          if (String(entry.id) === String(entryId)) {
            // Revert state (toggle back)
            const isAttending = entry.pivot?.is_attending ?? false;
            const currentCount = entry.pivot?.attending_count ?? 0;
            return {
              ...entry,
              pivot: {
                ...entry.pivot,
                is_attending: !isAttending,
                attending_count: isGroup
                  ? (isAttending ? Math.max(0, currentCount - 1) : currentCount + 1)
                  : currentCount
              }
            };
          }
          return entry;
        });

        const newTimetable = { ...targetTimetable, entries: newEntries };
        if (type === 'official') state.official[targetId] = newTimetable;
        else if (type === 'personal') state.personal[targetId] = newTimetable;
        else if (type === 'group') state.groups[targetId] = newTimetable;
      }

      if (type === 'group') {
        state.groupsList = state.groupsList.map(group => {
          if (String(group.id) === String(targetId) && group.timetables) {
             // ... analogous rollback for groupsList if needed ...
             // For simplicity I'll keep it consistent with the pending logic
             return {
               ...group,
               timetables: group.timetables.map((t: any) => {
                 if (String(t.id) === String(timetableId) && t.entries) {
                  return {
                    ...t,
                    entries: t.entries.map((entry: TimetableEntry) => {
                      if (String(entry.id) === String(entryId)) {
                        const isAttending = entry.pivot?.is_attending ?? false;
                        const currentCount = entry.pivot?.attending_count ?? 0;
                        return {
                          ...entry,
                          pivot: {
                            ...entry.pivot,
                            is_attending: !isAttending,
                            attending_count: isAttending ? Math.max(0, currentCount - 1) : currentCount + 1
                          }
                        };
                      }
                      return entry;
                    })
                  };
                 }
                 return t;
               })
             };
          }
          return group;
        });
      }
    });
  },
});

export default timetableSlice.reducer;
