import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { groupsApi } from "../api/groups";
import { groupSchema } from "../validation/schemas";

export const useGroups = () => {
  const queryClient = useQueryClient();

  const groups = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupsApi.getAll(),
  });

  const createGroup = useMutation({
    mutationFn: (data: { name: string; description?: string }) => {
      groupSchema.parse(data);
      return groupsApi.create(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });

  const createSharedTimetable = useMutation({
    mutationFn: ({
      groupId,
      data,
    }: {
      groupId: string;
      data: { event_id: string; name: string };
    }) => groupsApi.createSharedTimetable(groupId, data),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    },
  });

  return {
    groups,
    createGroup,
    createSharedTimetable,
  };
};
