import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timetablesApi } from '../api/timetables';
import { timetablesRepository } from '../database/repositories/timetables.repository';
import { groupTimetablesRepository } from '../database/repositories/groupTimetables.repository';
import { Timetable } from '../types/timetable';
import { useAuthStore } from '../store/useAuthStore';
import { Group } from '../types/group';
import { isUserAttendingEntry, updateTimetableEntryAttendance, updateGroupsCacheAttendance } from '../utils/cacheUpdates';
import { getDb } from '../database/sqlite';

interface MutationContext {
  previousTimetable?: Timetable | null;
  previousGroups?: Group[] | null;
}

const getTimetableQueryKey = (type: string, targetId: string, id: string) => {
  return type === 'group'
    ? ['timetable', 'group', targetId, id]
    : ['timetable', type, targetId];
};

export const useOfficialTimetable = (eventId: string) => {
  return useQuery({
    queryKey: ['timetable', 'official', eventId],
    queryFn: async () => {
      try {
        const res = await timetablesApi.getOfficial(eventId);
        if (res.data) {
          await timetablesRepository.upsert(res.data);
        }
        return res.data;
      } catch (err) {
        console.warn(`Failed to fetch official timetable for ${eventId}, trying local DB:`, err);
        const localTimetables = await timetablesRepository.getByEventId(eventId);
        const official = localTimetables.find(t => t.is_official);
        if (official) return official;
        throw err;
      }
    },
    enabled: !!eventId,
  });
};

export const useGroupTimetables = (groupId: string) => {
  return useQuery({
    queryKey: ['timetable', 'group', groupId],
    queryFn: async () => {
      const res = await timetablesApi.getGroupTimetables(groupId);
      const list = res.data;
      return Array.isArray(list) ? list[0] : list;
    },
    enabled: !!groupId,
  });
};

export const useGroupTimetable = (groupId: string | null, timetableId: string | null) => {
  return useQuery({
    queryKey: ['timetable', 'group', groupId, timetableId],
    queryFn: async () => {
      if (!groupId || !timetableId) return null;
      try {
        const res = await timetablesApi.getGroupTimetable(groupId, timetableId);
        if (res.data) {
          // Cache locally for offline fallback (passes group_id through the API response)
          await groupTimetablesRepository.upsert({ ...res.data, group_id: groupId });
        }
        return res.data;
      } catch (err) {
        console.warn(`Failed to fetch group timetable ${timetableId}, trying local DB:`, err);
        const localTimetable = await groupTimetablesRepository.getById(timetableId);
        if (localTimetable) return localTimetable;
        throw err;
      }
    },
    enabled: !!groupId && !!timetableId,
  });
};

export const useGroups = () => {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await timetablesApi.getGroups();
      return res.data;
    },
  });
};

export const useToggleAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: { 
      id: string, 
      entryId: string, 
      isGroup: boolean,
      type: 'official' | 'personal' | 'group',
      targetId: string,
      eventId?: string
    }) => {
      const res = await timetablesApi.toggleAttend(
        variables.id, 
        variables.entryId, 
        variables.isGroup, 
        variables.type === 'group' ? variables.targetId : undefined,
        variables.eventId
      );
      return { ...variables, serverData: res.data };
    },
    onMutate: async (variables) => {
      const { id, entryId, type, targetId, isGroup } = variables;
      const queryKey = getTimetableQueryKey(type, targetId, id);

      await queryClient.cancelQueries({ queryKey });
      const previousTimetable = queryClient.getQueryData<Timetable>(queryKey);

      if (previousTimetable) {
        const entry = previousTimetable.entries?.find(e => String(e.id) === String(entryId));
        const wasAttending = isUserAttendingEntry(entry, isGroup);
        
        const currentUser = useAuthStore.getState().user;
        const newTimetable = updateTimetableEntryAttendance(
          previousTimetable,
          entryId,
          !wasAttending,
          undefined,
          currentUser,
          isGroup
        );
        queryClient.setQueryData(queryKey, newTimetable);
      }

      let previousGroups: Group[] | undefined;
      if (type === 'group') {
        const groupsKey = ['groups'];
        await queryClient.cancelQueries({ queryKey: groupsKey });
        previousGroups = queryClient.getQueryData<Group[]>(groupsKey);

        if (previousGroups) {
          const group = previousGroups.find(g => String(g.id) === String(targetId));
          const timetable = group?.timetables?.find(t => String(t.id) === String(id));
          const entry = timetable?.entries?.find(e => String(e.id) === String(entryId));
          const wasAttending = isUserAttendingEntry(entry, true);
          
          const currentUser = useAuthStore.getState().user;
          const newGroups = updateGroupsCacheAttendance(
            previousGroups,
            targetId,
            id,
            entryId,
            !wasAttending,
            undefined,
            currentUser
          );
          queryClient.setQueryData(groupsKey, newGroups);
        }
      }

      return { previousTimetable, previousGroups } as MutationContext;
    },
    onError: (err, variables, context: MutationContext | undefined) => {
      const queryKey = getTimetableQueryKey(variables.type, variables.targetId, variables.id);

      if (context?.previousTimetable) {
        queryClient.setQueryData(queryKey, context.previousTimetable);
      }
      if (context?.previousGroups) {
        queryClient.setQueryData(['groups'], context.previousGroups);
      }
    },
    onSuccess: (data, variables) => {
      const { id, entryId, type, targetId, isGroup } = variables;
      const { is_attending, count } = data.serverData;
      
      const queryKey = getTimetableQueryKey(type, targetId, id);

      const currentUser = useAuthStore.getState().user;

      if (typeof is_attending !== 'undefined') {
        getDb().then(db => {
          db.runAsync(
            `INSERT OR REPLACE INTO timetable_entry_attendance (entry_id, is_attending) VALUES (?, ?)`,
            [entryId, is_attending ? 1 : 0]
          ).catch(e => console.error("Failed to update sqlite attendance", e));
        });
      }

      queryClient.setQueryData<Timetable>(queryKey, (old) => {
        if (!old) return old;
        return updateTimetableEntryAttendance(
          old,
          entryId,
          is_attending,
          count,
          currentUser,
          isGroup
        );
      });

      if (type === 'group') {
        queryClient.setQueryData<Group[]>(['groups'], (old) => {
          if (!old) return old;
          return updateGroupsCacheAttendance(
            old,
            targetId,
            id,
            entryId,
            is_attending,
            count,
            currentUser
          );
        });
      }
    },
    onSettled: (data, error, variables) => {
      const queryKey = getTimetableQueryKey(variables.type, variables.targetId, variables.id);

      queryClient.invalidateQueries({ queryKey });
      if (variables.type === 'group') {
        queryClient.invalidateQueries({ queryKey: ['groups'] });
        queryClient.invalidateQueries({ queryKey: ['attendance', variables.targetId, variables.id, variables.entryId] });
      }
    },
  });
};
