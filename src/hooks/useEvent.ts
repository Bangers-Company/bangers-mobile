import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../api/events';

export const useEvent = (eventId: string) => {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const res = await eventsApi.getById(eventId);
      return res.data;
    },
    enabled: !!eventId,
  });
};

export const useAttendees = (eventId: string) => {
  return useQuery({
    queryKey: ['attendees', eventId],
    queryFn: async () => {
      const res = await eventsApi.getAttendees(eventId);
      return res.data;
    },
    enabled: !!eventId,
  });
};
