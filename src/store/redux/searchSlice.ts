import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { searchApi, SearchResponse } from '../../api/search';

interface SearchState {
  searchQuery: string;
  results: SearchResponse['data'] | null;
  loading: boolean;
  error: string | null;
  entities: string[];
}

const initialState: SearchState = {
  searchQuery: '',
  results: null,
  loading: false,
  error: null,
  entities: ['events', 'artists', 'acts', 'users'],
};

export const performSearchAction = createAsyncThunk(
  'search/performSearch',
  async ({ query, entities }: { query: string; entities: string[] }, { rejectWithValue }) => {
    if (!query.trim()) return null;
    try {
      const response = await searchApi.search(query, entities);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Search failed');
    }
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setEntities: (state, action: PayloadAction<string[]>) => {
      state.entities = action.payload;
    },
    toggleEntity: (state, action: PayloadAction<string>) => {
      const entity = action.payload;
      if (state.entities.includes(entity)) {
        state.entities = state.entities.filter((e) => e !== entity);
      } else {
        state.entities.push(entity);
      }
    },
    clearSearch: (state) => {
      state.results = null;
      state.searchQuery = '';
    }
  },
  extraReducers: (builder) => {
    builder.addCase(performSearchAction.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(performSearchAction.fulfilled, (state, action) => {
      state.loading = false;
      state.results = action.payload;
    });
    builder.addCase(performSearchAction.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  }
});

export const { setSearchQuery, setEntities, toggleEntity, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;
