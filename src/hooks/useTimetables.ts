import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/redux/store';
import { 
  fetchOfficialTimetable, 
  fetchPersonalTimetable, 
  fetchGroupTimetable,
  fetchGroupsList,
  toggleAttendance 
} from '../store/redux/timetableSlice';

export const useOfficialTimetable = (eventId: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const timetable = useSelector((state: RootState) => state.timetable.official[eventId]);
  const loading = useSelector((state: RootState) => state.timetable.loading[eventId]);
  const error = useSelector((state: RootState) => state.timetable.error[eventId]);

  useEffect(() => {
    if (eventId && !timetable && !loading) {
      dispatch(fetchOfficialTimetable(eventId));
    }
  }, [eventId, timetable, loading, dispatch]);

  return { data: timetable, isLoading: loading, error };
};

export const usePersonalTimetable = (eventId: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const timetable = useSelector((state: RootState) => state.timetable.personal[eventId]);
  const loading = useSelector((state: RootState) => state.timetable.loading[eventId]);
  const error = useSelector((state: RootState) => state.timetable.error[eventId]);

  useEffect(() => {
    if (eventId && !timetable && !loading) {
      dispatch(fetchPersonalTimetable(eventId));
    }
  }, [eventId, timetable, loading, dispatch]);

  return { data: timetable, isLoading: loading, error };
};

export const useGroupTimetables = (groupId: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const timetable = useSelector((state: RootState) => state.timetable.groups[groupId]);
  const loading = useSelector((state: RootState) => state.timetable.loading[groupId]);
  const error = useSelector((state: RootState) => state.timetable.error[groupId]);

  useEffect(() => {
    if (groupId && !timetable && !loading) {
      dispatch(fetchGroupTimetable(groupId));
    }
  }, [groupId, timetable, loading, dispatch]);

  return { data: timetable, isLoading: loading, error };
};

export const useGroups = () => {
  const dispatch = useDispatch<AppDispatch>();
  const groups = useSelector((state: RootState) => state.timetable.groupsList);
  const loading = useSelector((state: RootState) => state.timetable.loading['groupsList']);
  const error = useSelector((state: RootState) => state.timetable.error['groupsList']);

  useEffect(() => {
    if (groups.length === 0 && !loading) {
      dispatch(fetchGroupsList());
    }
  }, [groups.length, loading, dispatch]);

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
