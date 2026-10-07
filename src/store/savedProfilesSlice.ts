import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { SavedItem } from "@/lib/types";

interface SavedState {
  items: SavedItem[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: SavedState = { items: [], loaded: false, loading: false, error: null };
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");
type Cfg = { rejectValue: string };

export const loadSaved = createAsyncThunk<SavedItem[], void, Cfg>(
  "saved/load",
  async (_, { rejectWithValue }) => {
    try {
      return (await api<{ items: SavedItem[] }>("/api/saved")).items;
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

export const saveProfile = createAsyncThunk<SavedItem, string, Cfg>(
  "saved/save",
  async (username, { rejectWithValue }) => {
    try {
      return (await api<{ item: SavedItem }>("/api/saved", { method: "POST", body: { username } })).item;
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

export const removeSaved = createAsyncThunk<string, string, Cfg>(
  "saved/remove",
  async (username, { rejectWithValue }) => {
    try {
      await api(`/api/saved?username=${encodeURIComponent(username)}`, { method: "DELETE" });
      return username;
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

const savedSlice = createSlice({
  name: "saved",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(loadSaved.pending, (s) => {
      s.loading = true;
    });
    b.addCase(loadSaved.fulfilled, (s, a) => {
      s.loading = false;
      s.loaded = true;
      s.items = a.payload;
    });
    b.addCase(loadSaved.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload ?? null;
    });
    b.addCase(saveProfile.fulfilled, (s, a) => {
      s.items = [a.payload, ...s.items.filter((i) => i.username.toLowerCase() !== a.payload.username.toLowerCase())];
    });
    b.addCase(saveProfile.rejected, (s, a) => {
      s.error = a.payload ?? null;
    });
    b.addCase(removeSaved.fulfilled, (s, a) => {
      s.items = s.items.filter((i) => i.username.toLowerCase() !== a.payload.toLowerCase());
    });
  },
});

export default savedSlice.reducer;
