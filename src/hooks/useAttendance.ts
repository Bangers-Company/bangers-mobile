import NetInfo from "@react-native-community/netinfo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { eventsApi } from "../api/events";

export const useOffline = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  return isOffline;
};

export const useAttendance = (eventId: string) => {
  const queryClient = useQueryClient();

  const updateAttendance = useMutation({
    mutationFn: () => eventsApi.updateAttendance(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", eventId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const removeAttendance = useMutation({
    mutationFn: () => eventsApi.deleteAttendance(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", eventId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return {
    updateAttendance,
    removeAttendance,
  };
};
