import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { HistoryItem, RepoDTO, Report } from "@/lib/types";

interface GithubState {
  report: Report | null;
  loading: boolean;
  error: string | null;
  history: HistoryItem[];
  historyLoading: boolean;
  repos: RepoDTO[];
  repoLanguages: string[];
  reposLoading: boolean;
}

const initialState: GithubState = {
  report: null,
  loading: false,
  error: null,
  history: [],
  historyLoading: false,
  repos: [],
  repoLanguages: [],
  reposLoading: false,
};

const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");
type Cfg = { rejectValue: string };

export const analyzeProfile = createAsyncThunk<Report, { url: string; refresh?: boolean }, Cfg>(
  "github/analyze",
  async (body, { rejectWithValue }) => {
    try {
      return await api<Report>("/api/github/analyze", { method: "POST", body });
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

/** Open the latest stored analysis for a user; analyze from GitHub if none exists yet. */
export const openProfile = createAsyncThunk<Report, string, Cfg>(
  "github/openProfile",
  async (username, { rejectWithValue }) => {
    try {
      return await api<Report>(`/api/github/profile/${encodeURIComponent(username)}`);
    } catch {
      try {
        return await api<Report>("/api/github/analyze", { method: "POST", body: { url: username } });
      } catch (e) {
        return rejectWithValue(msg(e));
      }
    }
  }
);

export const loadReport = createAsyncThunk<Report, string, Cfg>(
  "github/loadReport",
  async (id, { rejectWithValue }) => {
    try {
      return await api<Report>(`/api/history/${id}`);
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

export const loadHistory = createAsyncThunk<HistoryItem[], void, Cfg>(
  "github/loadHistory",
  async (_, { rejectWithValue }) => {
    try {
      return (await api<{ items: HistoryItem[] }>("/api/history")).items;
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

export const deleteReport = createAsyncThunk<string, string, Cfg>(
  "github/deleteReport",
  async (id, { rejectWithValue }) => {
    try {
      await api(`/api/history/${id}`, { method: "DELETE" });
      return id;
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

export interface RepoQuery {
  username: string;
  q?: string;
  language?: string;
  sort?: string;
  forks?: boolean;
}

export const searchRepos = createAsyncThunk<{ repos: RepoDTO[]; languages: string[] }, RepoQuery, Cfg>(
  "github/searchRepos",
  async (p, { rejectWithValue }) => {
    try {
      const sp = new URLSearchParams({ username: p.username });
      if (p.q) sp.set("q", p.q);
      if (p.language) sp.set("language", p.language);
      if (p.sort) sp.set("sort", p.sort);
      if (p.forks) sp.set("forks", "1");
      return await api(`/api/github/repositories?${sp.toString()}`);
    } catch (e) {
      return rejectWithValue(msg(e));
    }
  }
);

const githubSlice = createSlice({
  name: "github",
  initialState,
  reducers: {
    clearGithubError(state) {
      state.error = null;
    },
  },
  extraReducers: (b) => {
    for (const thunk of [analyzeProfile, openProfile, loadReport]) {
      b.addCase(thunk.pending, (s) => {
        s.loading = true;
        s.error = null;
      });
      b.addCase(thunk.fulfilled, (s, a) => {
        s.loading = false;
        s.report = a.payload;
      });
      b.addCase(thunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload ?? "Request failed";
      });
    }
    b.addCase(loadHistory.pending, (s) => {
      s.historyLoading = true;
    });
    b.addCase(loadHistory.fulfilled, (s, a) => {
      s.historyLoading = false;
      s.history = a.payload;
    });
    b.addCase(loadHistory.rejected, (s, a) => {
      s.historyLoading = false;
      s.error = a.payload ?? null;
    });
    b.addCase(deleteReport.fulfilled, (s, a) => {
      s.history = s.history.filter((h) => h.id !== a.payload);
    });
    b.addCase(searchRepos.pending, (s) => {
      s.reposLoading = true;
    });
    b.addCase(searchRepos.fulfilled, (s, a) => {
      s.reposLoading = false;
      s.repos = a.payload.repos;
      s.repoLanguages = a.payload.languages;
    });
    b.addCase(searchRepos.rejected, (s, a) => {
      s.reposLoading = false;
      s.error = a.payload ?? null;
    });
  },
});

export const { clearGithubError } = githubSlice.actions;
export default githubSlice.reducer;
