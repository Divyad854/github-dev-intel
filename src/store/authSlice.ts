import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

interface AuthState {
  user: AuthUser | null;
  status: "idle" | "loading" | "ready";
  error: string | null;
}

const initialState: AuthState = { user: null, status: "idle", error: null };

const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export const fetchMe = createAsyncThunk<AuthUser | null>("auth/fetchMe", async () => {
  try {
    const { user } = await api<{ user: AuthUser }>("/api/auth/me");
    return user;
  } catch {
    return null;
  }
});

export const login = createAsyncThunk<AuthUser, { email: string; password: string }, { rejectValue: string }>(
  "auth/login",
  async (body, { rejectWithValue }) => {
    try {
      return (await api<{ user: AuthUser }>("/api/auth/login", { method: "POST", body })).user;
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

export const register = createAsyncThunk<
  AuthUser,
  { name: string; email: string; password: string },
  { rejectValue: string }
>("auth/register", async (body, { rejectWithValue }) => {
  try {
    return (await api<{ user: AuthUser }>("/api/auth/register", { method: "POST", body })).user;
  } catch (e) {
    return rejectWithValue(msg(e));
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchMe.pending, (s) => {
      s.status = "loading";
    });
    b.addCase(fetchMe.fulfilled, (s, a) => {
      s.user = a.payload;
      s.status = "ready";
    });
    for (const thunk of [login, register]) {
      b.addCase(thunk.pending, (s) => {
        s.status = "loading";
        s.error = null;
      });
      b.addCase(thunk.fulfilled, (s, a) => {
        s.user = a.payload;
        s.status = "ready";
      });
      b.addCase(thunk.rejected, (s, a) => {
        s.status = "ready";
        s.error = a.payload ?? "Request failed";
      });
    }
    b.addCase(logout.fulfilled, (s) => {
      s.user = null;
      s.status = "ready";
    });
  },
});

export const { setUser, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
