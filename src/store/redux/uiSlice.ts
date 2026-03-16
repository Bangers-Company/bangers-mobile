import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark' | 'system';

interface UIState {
  themeMode: ThemeMode;
  isAmoled: boolean;
  accentColor: string | null;
  isBottomNavVisible: boolean;
}

const initialState: UIState = {
  themeMode: 'system',
  isAmoled: false,
  accentColor: null,
  isBottomNavVisible: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.themeMode = action.payload;
    },
    setIsAmoled: (state, action: PayloadAction<boolean>) => {
      state.isAmoled = action.payload;
    },
    setAccentColor: (state, action: PayloadAction<string | null>) => {
      state.accentColor = action.payload;
    },
    setIsBottomNavVisible: (state, action: PayloadAction<boolean>) => {
      state.isBottomNavVisible = action.payload;
    },
  },
});

export const { 
  setThemeMode, 
  setIsAmoled, 
  setAccentColor, 
  setIsBottomNavVisible 
} = uiSlice.actions;

export default uiSlice.reducer;
