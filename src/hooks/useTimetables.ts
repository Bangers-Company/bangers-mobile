import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timetablesApi } from '../api/timetables';
import { Timetable, TimetableEntry } from '../types/timetable';
import { useAuthStore } from '../store/useAuthStore';
import { Group } from '../types/group';

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
      const queryKey = type === 'group'
        ? ['timetable', 'group', targetId, id]
        : ['timetable', type, targetId];

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
            
            let newAttendees = entry.attendees ? [...entry.attendees] : [];
            if (isGroup) {
              const currentUser = useAuthStore.getState().user;
              if (currentUser) {
                if (wasAttending) {
                  newAttendees = newAttendees.filter((u: any) => u.id !== currentUser.id);
                } else {
                  newAttendees.push({
                    id: currentUser.id,
                    name: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim(),
                    profile_photo_path: null // optimistic
                  });
                }
              }
            }
            
            return {
              ...entry,
              attendees: isGroup ? newAttendees : entry.attendees,
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
      let previousGroups: Group[] | undefined;
      if (type === 'group') {
        const groupsKey = ['groups'];
        await queryClient.cancelQueries({ queryKey: groupsKey });
        previousGroups = queryClient.getQueryData<Group[]>(groupsKey);

        if (previousGroups) {
          const newGroups = (previousGroups as Group[]).map(group => {
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
                          
                          let newAttendees = entry.attendees || [];
                          const currentUser = useAuthStore.getState().user;
                          if (currentUser) {
                            if (wasAttending) {
                              newAttendees = newAttendees.filter((u) => u.id !== currentUser.id);
                            } else {
                              newAttendees = [...newAttendees, {
                                id: currentUser.id,
                                name: `${currentUser.first_name} ${currentUser.last_name}`,
                                profile_photo_path: currentUser.profile_media_url || null
                              }];
                            }
                          }

                          return {
                            ...entry,
                            attendees: newAttendees,
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
      const queryKey = variables.type === 'group'
        ? ['timetable', 'group', variables.targetId, variables.id]
        : ['timetable', variables.type, variables.targetId];

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
      
      const queryKey = type === 'group'
        ? ['timetable', 'group', targetId, id]
        : ['timetable', type, targetId];

      // Update the timetable query with authoritative server data
      queryClient.setQueryData<Timetable>(queryKey, (old) => {
        if (!old || !old.entries) return old;
        return {
          ...old,
          entries: old.entries.map(entry => {
            if (String(entry.id) === String(entryId)) {
              if (isGroup) {
                return {
                  ...entry,
                  pivot: {
                    ...entry.pivot,
                    is_attending: is_attending,
                    attending_count: count ?? entry.pivot?.attending_count ?? 0
                  }
                };
              } else {
                return {
                  ...entry,
                  is_attending: is_attending
                };
              }
            }
            return entry;
          })
        };
      });

      if (type === 'group') {
        queryClient.setQueryData<Group[]>(['groups'], (old) => {
          if (!old) return old;
          return old.map(group => {
            if (String(group.id) === String(targetId) && group.timetables) {
              return {
                ...group,
                timetables: group.timetables.map((t: Timetable) => {
                  if (String(t.id) === String(id) && t.entries) {
                    return {
                      ...t,
                      entries: t.entries.map((entry: TimetableEntry) => {
                        if (String(entry.id) === String(entryId)) {
                          return {
                            ...entry,
                            pivot: {
                              ...entry.pivot,
                              is_attending: is_attending,
                              attending_count: count ?? entry.pivot?.attending_count ?? 0
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
        });
      }
    },
    onSettled: (data, error, variables) => {
      const queryKey = variables.type === 'group'
        ? ['timetable', 'group', variables.targetId, variables.id]
        : ['timetable', variables.type, variables.targetId];

      // We still invalidate to be safe, but onSuccess already updated the cache
      queryClient.invalidateQueries({ queryKey });
      if (variables.type === 'group') {
        queryClient.invalidateQueries({ queryKey: ['groups'] });
        queryClient.invalidateQueries({ queryKey: ['attendance', variables.targetId, variables.id, variables.entryId] });
      }
    },
  });
};
