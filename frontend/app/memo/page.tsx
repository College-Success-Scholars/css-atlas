import { backendGet } from "@/lib/server/api-client";
import { dateToCampusWeek } from "@/lib/time";
import { MemoContent } from "./memo-content";
import type { MemoScholarRow, MemoTLRow, MemoPieData } from "./memo-content";
import type { ScholarWithCompletedSession } from "@/lib/session-logs";
import type { TrafficSession } from "@/lib/traffic";
import type { FormCompletionOverall } from "@/components/form-completion-overview-card";

/** Always fetch fresh data on load and on router.refresh() (no segment cache). */
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ week?: string }>;
};

type MemoPageData = {
  scholars: MemoScholarRow[];
  teamLeaders: MemoTLRow[];
  pieData: MemoPieData;
  formCompletionOverall: FormCompletionOverall;
  completedStudy: ScholarWithCompletedSession[];
  completedFd: ScholarWithCompletedSession[];
  trafficWeeklyData: { weekNumber: number; entryCount: number }[];
  trafficEntryCountForSelectedWeek: number;
  trafficSessions: TrafficSession[];
  weekLabel: string;
  currentCampusWeek: number | null;
  selectedWeekNum: number;
};

export default async function MemoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const weekParam = params.week ?? "";
  const currentCampusWeek = dateToCampusWeek(new Date());
  const weekNum =
    weekParam !== ""
      ? Math.max(1, Math.min(99, parseInt(weekParam, 10) || 1))
      : currentCampusWeek != null
        ? Math.max(1, Math.min(99, currentCampusWeek))
        : 1;

  const data = await backendGet<MemoPageData>(`/api/memo/page-data?weekNum=${weekNum}`);

  return (
    <MemoContent
      scholars={data.scholars}
      teamLeaders={data.teamLeaders}
      pieData={data.pieData}
      formCompletionOverall={data.formCompletionOverall}
      completedStudy={data.completedStudy}
      completedFd={data.completedFd}
      trafficWeeklyData={data.trafficWeeklyData}
      trafficEntryCountForSelectedWeek={data.trafficEntryCountForSelectedWeek}
      trafficSessions={data.trafficSessions}
      weekLabel={data.weekLabel}
      currentCampusWeek={data.currentCampusWeek}
      selectedWeekNum={data.selectedWeekNum}
      trafficCardSpan="half"
      trafficCardTitle="Traffic log"
      trafficCardDescription={null}
    />
  );
}
