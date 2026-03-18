import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { friendsApi } from '../api/friends';

export const useFriendshipStatus = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['friendship', userId],
    queryFn: async () => {
      if (!userId) return 'none';
      const [friendsRes, requestsRes] = await Promise.all([
        friendsApi.getFriends(),
        friendsApi.getRequests(),
      ]);

      const isFriend = (friendsRes.data.data || []).some((f: any) => f.id === userId);
      if (isFriend) return 'friends';

      const receivedReq = (requestsRes.data.data || []).find((r: any) => r.requester?.id === userId);
      if (receivedReq) return 'pending_received';

      return 'none';
    },
    enabled: !!userId,
  });
};

export const useFriendshipActions = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const sendRequest = useMutation({
    mutationFn: () => friendsApi.sendRequest(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendship', userId] });
    },
  });

  const acceptRequest = useMutation({
    mutationFn: () => friendsApi.acceptRequest(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendship', userId] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const removeFriend = useMutation({
    mutationFn: () => friendsApi.removeFriend(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendship', userId] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return { sendRequest, acceptRequest, removeFriend };
};
