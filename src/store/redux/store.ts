import { configureStore } from '@reduxjs/toolkit';
import timetableReducer from './timetableSlice';

export const store = configureStore({
  reducer: {
    timetable: timetableReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
