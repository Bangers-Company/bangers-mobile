import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/redux/store';
import { 
  fetchOfficialTimetable, 
  fetchPersonalTimetable, 
  fetchGroupTimetable,
  fetchGroupsList,
  createPersonalTimetable,
  createGroupAction,
  createGroupTimetableAction,
  toggleAttendance 
} from '../store/redux/timetableSlice';

export const useOfficialTimetable = (eventId: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const timetable = useSelector((state: RootState) => state.timetable.official[eventId]);
  const loading = useSelector((state: RootState) => state.timetable.loading[`official_${eventId}`]);
  const error = useSelector((state: RootState) => state.timetable.error[`official_${eventId}`]);

  useEffect(() => {
    if (eventId && timetable === undefined && !loading && !error) {
      dispatch(fetchOfficialTimetable(eventId));
    }
  }, [eventId, timetable, loading, error, dispatch]);

  return { data: timetable, isLoading: loading, error };
};

export const usePersonalTimetable = (eventId: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const timetable = useSelector((state: RootState) => state.timetable.personal[eventId]);
  const loading = useSelector((state: RootState) => state.timetable.loading[`personal_${eventId}`]);
  const error = useSelector((state: RootState) => state.timetable.error[`personal_${eventId}`]);

  useEffect(() => {
    if (eventId && timetable === undefined && !loading && !error) {
      dispatch(fetchPersonalTimetable(eventId));
    }
  }, [eventId, timetable, loading, error, dispatch]);

  return { data: timetable, isLoading: loading, error };
};

export const useGroupTimetables = (groupId: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const timetable = useSelector((state: RootState) => state.timetable.groups[groupId]);
  const loading = useSelector((state: RootState) => state.timetable.loading[`group_${groupId}`]);
  const error = useSelector((state: RootState) => state.timetable.error[`group_${groupId}`]);

  useEffect(() => {
    if (groupId && timetable === undefined && !loading && !error) {
      dispatch(fetchGroupTimetable(groupId));
    }
  }, [groupId, timetable, loading, error, dispatch]);

  return { data: timetable, isLoading: loading, error };
};

export const useGroups = () => {
  const dispatch = useDispatch<AppDispatch>();
  const groups = useSelector((state: RootState) => state.timetable.groupsList);
  const loading = useSelector((state: RootState) => state.timetable.loading['groupsList']);
  const error = useSelector((state: RootState) => state.timetable.error['groupsList']);
  const hasFetched = useSelector((state: RootState) => state.timetable.loading['groupsList'] !== undefined);

  useEffect(() => {
    if (!hasFetched && !loading && !error) {
      dispatch(fetchGroupsList());
    }
  }, [hasFetched, loading, error, dispatch]);

  return { data: groups, isLoading: loading, error };
};

export const useToggleAttendance = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  const mutate = async (variables: { 
    id: string, 
    entryId: string, 
    isGroup: boolean,
    type: 'official' | 'personal' | 'group',
    targetId: string 
  }) => {
    return dispatch(toggleAttendance({
      timetableId: variables.id,
      entryId: variables.entryId,
      isGroup: variables.isGroup,
      type: variables.type,
      targetId: variables.targetId
    }));
  };

  return { mutate };
};

export const useTimetableActions = () => {
  const dispatch = useDispatch<AppDispatch>();

  return {
    createPersonal: async (eventId: string, name: string) => 
      dispatch(createPersonalTimetable({ eventId, name })).unwrap(),
    createGroup: async (name: string, members: string[]) => 
      dispatch(createGroupAction({ name, members })).unwrap(),
    createGroupTimetable: async (groupId: string, eventId: string, name: string) => 
      dispatch(createGroupTimetableAction({ groupId, eventId, name })).unwrap(),
  };
};
