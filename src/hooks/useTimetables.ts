import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timetablesApi } from '../api/timetables';
import { Timetable, TimetableEntry } from '../types/timetable';

export const useOfficialTimetable = (eventId: string) => {
  return useQuery({
    queryKey: ['timetable', 'official', eventId],
    queryFn: async () => {
      const res = await timetablesApi.getOfficial(eventId);
      return (res.data as any).data || res.data;
    },
    enabled: !!eventId,
  });
};


export const useGroupTimetables = (groupId: string) => {
  return useQuery({
    queryKey: ['timetable', 'group', groupId],
    queryFn: async () => {
      const res = await timetablesApi.getGroupTimetables(groupId);
      const list = Array.isArray(res.data) ? res.data : (res.data as any).data;
      return Array.isArray(list) ? list[0] : list;
    },
    enabled: !!groupId,
  });
};

export const useGroups = () => {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await timetablesApi.getGroups();
      return (res.data as any).data || res.data;
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
      const queryKey = ['timetable', type, targetId];

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousTimetable = queryClient.getQueryData<Timetable>(queryKey);

      // Optimistically update
      if (previousTimetable && previousTimetable.entries) {
        const newEntries = previousTimetable.entries.map(entry => {
          if (String(entry.id) === String(entryId)) {
            const wasAttending = isGroup 
              ? (entry.pivot?.is_attending ?? false)
              : (entry.is_attending ?? false);
              
            const currentCount = entry.pivot?.attending_count ?? 0;
            
            return {
              ...entry,
              is_attending: !isGroup ? !wasAttending : entry.is_attending,
              pivot: isGroup ? {
                ...entry.pivot,
                is_attending: !wasAttending,
                attending_count: wasAttending ? Math.max(0, currentCount - 1) : currentCount + 1
              } : entry.pivot
            };
          }
          return entry;
        });

        queryClient.setQueryData(queryKey, { ...previousTimetable, entries: newEntries });
      }

      // If it's a group toggle, also update the groups list
      let previousGroups: any[] | undefined;
      if (type === 'group') {
        const groupsKey = ['groups'];
        await queryClient.cancelQueries({ queryKey: groupsKey });
        previousGroups = queryClient.getQueryData<any[]>(groupsKey);

        if (previousGroups) {
          const newGroups = previousGroups.map(group => {
            if (String(group.id) === String(targetId) && group.timetables) {
              return {
                ...group,
                timetables: group.timetables.map((t: any) => {
                  if (String(t.id) === String(id) && t.entries) {
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
          queryClient.setQueryData(groupsKey, newGroups);
        }
      }

      return { previousTimetable, previousGroups };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousTimetable) {
        queryClient.setQueryData(['timetable', variables.type, variables.targetId], context.previousTimetable);
      }
      if (context?.previousGroups) {
        queryClient.setQueryData(['groups'], context.previousGroups);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timetable', variables.type, variables.targetId] });
      if (variables.type === 'group') {
        queryClient.invalidateQueries({ queryKey: ['groups'] });
      }
    },
  });
};
