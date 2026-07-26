import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi } from "../api/events";

export const useAttendance = (eventId: string) => {
  const queryClient = useQueryClient();

  const updateAttendance = useMutation({
    mutationFn: () => eventsApi.updateAttendance(eventId, "going"),
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["event", eventId] });
      await queryClient.cancelQueries({ queryKey: ["profile"] });

      // Snapshot previous values
      const previousEvent = queryClient.getQueryData<import("../types/event").Event>(["event", eventId]);
      const previousProfile = queryClient.getQueryData<import("../types/user").User>(["profile"]);

      // Optimistically update event
      if (previousEvent) {
        queryClient.setQueryData(["event", eventId], {
          ...previousEvent,
          user_status: "going",
          attendee_count: (previousEvent.attendee_count || 0) + 1,
        });
      }

      // Optimistically update profile
      if (previousProfile) {
        queryClient.setQueryData(["profile"], {
          ...previousProfile,
          stats: {
            ...previousProfile.stats,
            upcoming_count: (previousProfile.stats?.upcoming_count || 0) + 1,
          },
          attendingEvents: [...(previousProfile.attendingEvents || []), previousEvent],
        });
      }

      return { previousEvent, previousProfile };
    },
    onError: (err, variables, context) => {
      if (context?.previousEvent) {
        queryClient.setQueryData(["event", eventId], context.previousEvent);
      }
      if (context?.previousProfile) {
        queryClient.setQueryData(["profile"], context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", eventId] });
    },
  });

  const removeAttendance = useMutation({
    mutationFn: () => eventsApi.deleteAttendance(eventId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["event", eventId] });
      await queryClient.cancelQueries({ queryKey: ["profile"] });

      const previousEvent = queryClient.getQueryData<any>(["event", eventId]);
      const previousProfile = queryClient.getQueryData<any>(["profile"]);

      if (previousEvent) {
        queryClient.setQueryData(["event", eventId], {
          ...previousEvent,
          user_status: null,
          attendee_count: Math.max(0, (previousEvent.attendee_count || 0) - 1),
        });
      }

      if (previousProfile) {
        queryClient.setQueryData(["profile"], {
          ...previousProfile,
          stats: {
            ...previousProfile.stats,
            upcoming_count: Math.max(0, (previousProfile.stats?.upcoming_count || 0) - 1),
          },
          attendingEvents: (previousProfile.attendingEvents || []).filter((e: import("../types/event").Event) => e.id !== eventId),
        });
      }

      return { previousEvent, previousProfile };
    },
    onError: (err, variables, context) => {
      if (context?.previousEvent) {
        queryClient.setQueryData(["event", eventId], context.previousEvent);
      }
      if (context?.previousProfile) {
        queryClient.setQueryData(["profile"], context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", eventId] });
    },
  });

  return {
    updateAttendance,
    removeAttendance,
  };
};
