import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { Report } from "@/lib/types";

interface ComparisonState {
  a: Report | null;
  b: Report | null;
  loading: boolean;
  error: string | null;
}

const initialState: ComparisonState = { a: null, b: null, loading: false, error: null };

export const runComparison = createAsyncThunk<
  { a: Report; b: Report },
  { a: string; b: string; refresh?: boolean },
  { rejectValue: string }
>("comparison/run", async (body, { rejectWithValue }) => {
  try {
    return await api<{ a: Report; b: Report }>("/api/compare", { method: "POST", body });
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : "Comparison failed");
  }
});

const comparisonSlice = createSlice({
  name: "comparison",
  initialState,
  reducers: {
    clearComparison(state) {
      state.a = null;
      state.b = null;
      state.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(runComparison.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(runComparison.fulfilled, (s, a) => {
      s.loading = false;
      s.a = a.payload.a;
      s.b = a.payload.b;
    });
    b.addCase(runComparison.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload ?? "Comparison failed";
    });
  },
});

export const { clearComparison } = comparisonSlice.actions;
export default comparisonSlice.reducer;
