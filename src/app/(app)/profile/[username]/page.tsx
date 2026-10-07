"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import ReportView from "@/components/ReportView";
import { ErrorBox, Spinner } from "@/components/ui";
import { analyzeProfile, loadReport, openProfile } from "@/store/githubSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadSaved, removeSaved, saveProfile } from "@/store/savedProfilesSlice";

function ProfileInner({ username }: { username: string }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const reportId = useSearchParams().get("report");
  const { report, loading, error } = useAppSelector((s) => s.github);
  const saved = useAppSelector((s) => s.savedProfiles);

  useEffect(() => {
    dispatch(loadSaved());
  }, [dispatch]);

  useEffect(() => {
    if (reportId) {
      if (report?.id !== reportId) dispatch(loadReport(reportId));
    } else if (report?.analysis.profile.username.toLowerCase() !== username.toLowerCase()) {
      dispatch(openProfile(username));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, username, dispatch]);

  const current = report && report.analysis.profile.username.toLowerCase() === username.toLowerCase() ? report : null;
  const isSaved = saved.items.some((i) => i.username.toLowerCase() === username.toLowerCase());

  async function refresh() {
    const res = await dispatch(analyzeProfile({ url: username, refresh: true }));
    if (analyzeProfile.fulfilled.match(res)) router.replace(`/profile/${username}?report=${res.payload.id}`);
  }

  if (loading && !current) return <Spinner label={`Analyzing ${username}…`} />;
  if (error && !current) return <ErrorBox message={error} />;
  if (!current) return <Spinner />;

  return (
    <ReportView
      report={current}
      saved={isSaved}
      busy={loading}
      onToggleSave={() => {
        if (isSaved) dispatch(removeSaved(username));
        else dispatch(saveProfile(username));
      }}
      onRefresh={refresh}
    />
  );
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  return (
    <Suspense fallback={<Spinner />}>
      <ProfileInner username={decodeURIComponent(params.username)} />
    </Suspense>
  );
}
