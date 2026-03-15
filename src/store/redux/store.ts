import { configureStore } from '@reduxjs/toolkit';
import timetableReducer from './timetableSlice';
import userReducer from './userSlice';
import uiReducer from './uiSlice';
import eventReducer from './eventSlice';
import searchReducer from './searchSlice';

export const store = configureStore({
  reducer: {
    timetable: timetableReducer,
    user: userReducer,
    ui: uiReducer,
    event: eventReducer,
    search: searchReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
