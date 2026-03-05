import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { friendsApi } from "../api/friends";

export const useFriends = () => {
  const queryClient = useQueryClient();

  const friends = useQuery({
    queryKey: ["friends"],
    queryFn: () => friendsApi.getFriends(),
  });

  const requests = useQuery({
    queryKey: ["friend-requests"],
    queryFn: () => friendsApi.getRequests(),
  });

  const sendRequest = useMutation({
    mutationFn: (userId: string) => friendsApi.sendRequest(userId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] }),
  });

  const acceptRequest = useMutation({
    mutationFn: (userId: string) => friendsApi.acceptRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });

  return {
    friends,
    requests,
    sendRequest,
    acceptRequest,
  };
};
