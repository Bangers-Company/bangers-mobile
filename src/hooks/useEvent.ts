import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../api/events';
import { eventsRepository } from '../database/repositories/events.repository';

export const useEvent = (eventId: string) => {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      try {
        const res = await eventsApi.getById(eventId);
        if (res.data) {
          // Persist to local DB for offline use
          await eventsRepository.upsert(res.data);
        }
        return res.data;
      } catch (err) {
        console.warn(`Failed to fetch event ${eventId} from API, trying local DB:`, err);
        const localEvent = await eventsRepository.getById(eventId);
        if (localEvent) return localEvent;
        throw err;
      }
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
