import { configureStore } from "@reduxjs/toolkit";
import auth from "./authSlice";
import github from "./githubSlice";
import comparison from "./comparisonSlice";
import savedProfiles from "./savedProfilesSlice";

export const makeStore = () =>
  configureStore({
    reducer: { auth, github, comparison, savedProfiles },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
