import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { friendsApi } from "../api/friends";
import { useDispatch } from "react-redux";
import { updateFriendsCount } from "../store/redux/userSlice";

export const useFriends = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

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
      dispatch(updateFriendsCount(1));
    },
  });

  return {
    friends,
    requests,
    sendRequest,
    acceptRequest,
  };
};
