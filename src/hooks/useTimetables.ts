import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timetablesApi } from '../api/timetables';
import { Timetable } from '../types/timetable';
import { useAuthStore } from '../store/useAuthStore';
import { Group } from '../types/group';
import { isUserAttendingEntry, updateTimetableEntryAttendance, updateGroupsCacheAttendance } from '../utils/cacheUpdates';

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
      const res = await timetablesApi.getOfficial(eventId);
      return res.data;
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
      const res = await timetablesApi.getGroupTimetable(groupId, timetableId);
      return res.data;
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
    onError: (err, variables, context: any) => {
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
