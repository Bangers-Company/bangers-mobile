import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuthStore } from "../store/useAuthStore";
import { RootState, AppDispatch } from "../store/redux/store";
import { fetchProfile } from "../store/redux/userSlice";

export function useProfile() {
  const dispatch = useDispatch<AppDispatch>();
  const { accessToken, refreshToken } = useAuthStore();
  
  const { 
    user, 
    attendingEvents, 
    pastEvents, 
    friendsCount, 
    loading, 
    error 
  } = useSelector((state: RootState) => state.user);

  const fetchProfileData = useCallback(async () => {
    if (!accessToken || !refreshToken) return;
    dispatch(fetchProfile());
  }, [accessToken, refreshToken, dispatch]);

  useEffect(() => {
    if (accessToken && refreshToken && !user && !loading) {
      fetchProfileData();
    }
  }, [accessToken, refreshToken, user, loading, fetchProfileData]);

  return {
    user,
    attendingEvents,
    pastEvents,
    friendsCount,
    loading,
    error,
    refreshProfile: fetchProfileData,
  };
}
