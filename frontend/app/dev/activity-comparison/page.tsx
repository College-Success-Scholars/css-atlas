"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { backendGet, backendPost } from "@/lib/client/api-client";
import type {
  FrontDeskRecordRow,
  StudySessionRecordRow,
} from "@/lib/types/session-record";
import type { ActivityRow } from "@/lib/types/supabase";
import {
  ScholarDataTable,
  CollapsibleTableSection,
  type ScholarDataTableColumn,
} from "@/components/scholar-data-table";
import { dateToCampusWeek } from "@/lib/format/time";
import { CampusWeekCard } from "@/components/campus-week-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RecordRowWithName = (FrontDeskRecordRow | StudySessionRecordRow) & {
  scholar_name?: string | null;
};

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri";

type ComparisonRow = {
  scholar_uid: string;
  scholar_name: string;
  uid: number | null;
  rec_mon: number;
  rec_tue: number;
  rec_wed: number;
  rec_thu: number;
  rec_fri: number;
  rec_total: number;
  act_mon: number;
  act_tue: number;
  act_wed: number;
  act_thu: number;
  act_fri: number;
  act_total: number;
  has_mismatch: boolean;
  mismatch_days: DayKey[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri"];
const DAY_INDEX_MAP: Record<number, DayKey> = {
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
};

/** Parse YYYY-MM-DD and return JS day-of-week (0=Sun…6=Sat). */
function parseDateDow(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y!, m! - 1, d!).getDay();
}

/** Pivot activity rows into a map: scholar_uid → { mon, tue, … } minutes. */
function pivotActivity(
  rows: ActivityRow[],
  logSource: string
): Map<string, Record<DayKey, number>> {
  const map = new Map<string, Record<DayKey, number>>();
  for (const row of rows) {
    if (row.log_source !== logSource) continue;
    const dow = parseDateDow(row.activity_date);
    const dayKey = DAY_INDEX_MAP[dow];
    if (!dayKey) continue; // skip weekends

    let entry = map.get(row.scholar_uid);
    if (!entry) {
      entry = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0 };
      map.set(row.scholar_uid, entry);
    }
    entry[dayKey] += row.duration_minutes ?? 0;
  }
  return map;
}

/** Build comparison rows by joining records with pivoted activity. */
function buildComparisonRows(
  records: RecordRowWithName[],
  activityMap: Map<string, Record<DayKey, number>>
): ComparisonRow[] {
  // Build a set of all scholar_uids from both sources
  const uidSet = new Set<string>();
  const recordsByUid = new Map<string, RecordRowWithName>();

  for (const rec of records) {
    if (rec.uid == null) continue;
    const key = String(rec.uid);
    uidSet.add(key);
    recordsByUid.set(key, rec);
  }
  for (const uid of activityMap.keys()) {
    uidSet.add(uid);
  }

  const rows: ComparisonRow[] = [];
  for (const scholarUid of uidSet) {
    const rec = recordsByUid.get(scholarUid);
    const act = activityMap.get(scholarUid) ?? {
      mon: 0,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
    };

    const recMon = rec?.mon_min ?? 0;
    const recTue = rec?.tues_min ?? 0;
    const recWed = rec?.wed_min ?? 0;
    const recThu = rec?.thurs_min ?? 0;
    const recFri = rec?.fri_min ?? 0;

    const mismatchDays: DayKey[] = [];
    if (recMon !== act.mon) mismatchDays.push("mon");
    if (recTue !== act.tue) mismatchDays.push("tue");
    if (recWed !== act.wed) mismatchDays.push("wed");
    if (recThu !== act.thu) mismatchDays.push("thu");
    if (recFri !== act.fri) mismatchDays.push("fri");

    const recTotal = recMon + recTue + recWed + recThu + recFri;
    const actTotal = act.mon + act.tue + act.wed + act.thu + act.fri;

    rows.push({
      scholar_uid: scholarUid,
      scholar_name: rec?.scholar_name ?? scholarUid,
      uid: rec?.uid ?? null,
      rec_mon: recMon,
      rec_tue: recTue,
      rec_wed: recWed,
      rec_thu: recThu,
      rec_fri: recFri,
      rec_total: recTotal,
      act_mon: act.mon,
      act_tue: act.tue,
      act_wed: act.wed,
      act_thu: act.thu,
      act_fri: act.fri,
      act_total: actTotal,
      has_mismatch: mismatchDays.length > 0,
      mismatch_days: mismatchDays,
    });
  }

  return rows.sort((a, b) => a.scholar_name.localeCompare(b.scholar_name));
}

function fmt(minutes: number): string {
  if (minutes === 0) return "0";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

function mismatchCell(
  row: ComparisonRow,
  day: DayKey,
  value: number
): React.ReactNode {
  const isMismatch = row.mismatch_days.includes(day);
  return (
    <span
      className={
        isMismatch ? "rounded bg-red-500/20 px-1 font-medium text-red-700 dark:text-red-400" : ""
      }
    >
      {fmt(value)}
    </span>
  );
}

function getColumns(): ScholarDataTableColumn<ComparisonRow>[] {
  const cols: ScholarDataTableColumn<ComparisonRow>[] = [
    {
      id: "name",
      header: "Scholar",
      field: "scholar_name",
      sortable: true,
      width: "180px",
    },
  ];

  for (const day of DAYS) {
    const label = day.charAt(0).toUpperCase() + day.slice(1);
    const recField = `rec_${day}` as keyof ComparisonRow;
    const actField = `act_${day}` as keyof ComparisonRow;

    cols.push({
      id: `${day}-rec`,
      header: `${label} Rec`,
      field: recField,
      sortable: true,
      renderCell: (row) => mismatchCell(row, day, row[recField] as number),
    });
    cols.push({
      id: `${day}-act`,
      header: `${label} Act`,
      field: actField,
      sortable: true,
      renderCell: (row) => mismatchCell(row, day, row[actField] as number),
    });
  }

  cols.push(
    {
      id: "total-rec",
      header: "Total Rec",
      field: "rec_total",
      sortable: true,
      renderCell: (row) => {
        const diff = row.rec_total !== row.act_total;
        return (
          <span className={diff ? "font-bold text-red-700 dark:text-red-400" : "font-medium"}>
            {fmt(row.rec_total)}
          </span>
        );
      },
    },
    {
      id: "total-act",
      header: "Total Act",
      field: "act_total",
      sortable: true,
      renderCell: (row) => {
        const diff = row.rec_total !== row.act_total;
        return (
          <span className={diff ? "font-bold text-red-700 dark:text-red-400" : "font-medium"}>
            {fmt(row.act_total)}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      field: "has_mismatch",
      sortable: true,
      getSortValue: (row) => (row.has_mismatch ? 0 : 1),
      renderCell: (row) =>
        row.has_mismatch ? (
          <Badge variant="destructive" className="text-xs">
            Mismatch
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            OK
          </Badge>
        ),
    }
  );

  return cols;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ActivityComparisonPage() {
  const searchParams = useSearchParams();
  const weekParam = searchParams.get("week") ?? "";
  const currentCampusWeek = dateToCampusWeek(new Date());
  const effectiveWeek = weekParam || String(currentCampusWeek ?? "");

  const [showOnlyMismatches, setShowOnlyMismatches] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "light" | "heavy" | "done">("idle");

  // Data states
  const [fdRecords, setFdRecords] = useState<RecordRowWithName[] | "loading" | null>(null);
  const [ssRecords, setSsRecords] = useState<RecordRowWithName[] | "loading" | null>(null);
  const [activityRows, setActivityRows] = useState<ActivityRow[] | "loading" | null>(null);

  const fetchComparisonData = useCallback((weekNum: number) => {
    setFdRecords("loading");
    setSsRecords("loading");
    setActivityRows("loading");

    backendGet<RecordRowWithName[]>(`/api/session-records/front-desk/week/${weekNum}/all`)
      .then((r) => setFdRecords(r.ok ? r.data : null))
      .catch(() => setFdRecords(null));

    backendGet<RecordRowWithName[]>(`/api/session-records/study/week/${weekNum}/all`)
      .then((r) => setSsRecords(r.ok ? r.data : null))
      .catch(() => setSsRecords(null));

    backendGet<ActivityRow[]>(`/api/daily-activity/week/${weekNum}`)
      .then((r) => setActivityRows(r.ok ? r.data : null))
      .catch(() => setActivityRows(null));
  }, []);

  // Light sync on page load / week change, then fetch data
  useEffect(() => {
    if (!effectiveWeek) return;
    const weekNum = parseInt(effectiveWeek, 10);
    if (Number.isNaN(weekNum) || weekNum < 1) return;

    let cancelled = false;
    setSyncStatus("light");

    backendPost("/api/memo/sync", { weekNum, mode: "light" })
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
        setSyncStatus("done");
        fetchComparisonData(weekNum);
      });

    return () => { cancelled = true; };
  }, [effectiveWeek, fetchComparisonData]);

  // Heavy sync: all UIDs (same as memo page)
  const handleHeavySync = useCallback(() => {
    if (!effectiveWeek) return;
    const weekNum = parseInt(effectiveWeek, 10);
    if (Number.isNaN(weekNum) || weekNum < 1) return;

    setSyncStatus("heavy");
    backendPost("/api/memo/sync", { weekNum, mode: "heavy" })
      .catch(() => {})
      .finally(() => {
        setSyncStatus("done");
        fetchComparisonData(weekNum);
      });
  }, [effectiveWeek, fetchComparisonData]);

  // Build comparison data
  const fdActivity = useMemo(
    () => (Array.isArray(activityRows) ? pivotActivity(activityRows, "front_desk_logs") : null),
    [activityRows]
  );
  const ssActivity = useMemo(
    () => (Array.isArray(activityRows) ? pivotActivity(activityRows, "study_session_logs") : null),
    [activityRows]
  );

  const fdComparison = useMemo(() => {
    if (!Array.isArray(fdRecords) || !fdActivity) return null;
    return buildComparisonRows(fdRecords, fdActivity);
  }, [fdRecords, fdActivity]);

  const ssComparison = useMemo(() => {
    if (!Array.isArray(ssRecords) || !ssActivity) return null;
    return buildComparisonRows(ssRecords, ssActivity);
  }, [ssRecords, ssActivity]);

  const fdFiltered = useMemo(
    () => (showOnlyMismatches ? fdComparison?.filter((r) => r.has_mismatch) : fdComparison) ?? null,
    [fdComparison, showOnlyMismatches]
  );
  const ssFiltered = useMemo(
    () => (showOnlyMismatches ? ssComparison?.filter((r) => r.has_mismatch) : ssComparison) ?? null,
    [ssComparison, showOnlyMismatches]
  );

  const columns = useMemo(() => getColumns(), []);

  const isSyncing = syncStatus === "light" || syncStatus === "heavy";
  const isLoading =
    isSyncing || fdRecords === "loading" || ssRecords === "loading" || activityRows === "loading";

  const fdMismatchCount = fdComparison?.filter((r) => r.has_mismatch).length ?? 0;
  const ssMismatchCount = ssComparison?.filter((r) => r.has_mismatch).length ?? 0;
  const fdTotal = fdComparison?.length ?? 0;
  const ssTotal = ssComparison?.length ?? 0;

  const selectedWeek = effectiveWeek ? parseInt(effectiveWeek, 10) : null;

  return (
    <div className="container mx-auto max-w-[1400px] space-y-6 py-8">
      <div>
        <Link
          href="/dev"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          &larr; Dev Tools
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Activity vs Records Comparison</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Compare <code>daily_scholar_activity</code> logs against{" "}
          <code>front_desk_records</code> / <code>study_session_records</code> for
          a given campus week.
        </p>
      </div>

      <CampusWeekCard
        basePath="/dev/activity-comparison"
        selectedWeek={selectedWeek}
      />

      {/* Summary */}
      {!isLoading && fdComparison && ssComparison && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary — Week {effectiveWeek}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              <strong>Rec</strong> = <code>front_desk_records</code> / <code>study_session_records</code> (weekly aggregated).{" "}
              <strong>Act</strong> = <code>daily_scholar_activity</code> (session logs, grouped by day).
            </p>
            <div className="flex flex-wrap gap-6">
            <div>
              <span className="font-medium">Front Desk:</span>{" "}
              {fdMismatchCount === 0 ? (
                <Badge variant="secondary">All {fdTotal} match</Badge>
              ) : (
                <Badge variant="destructive">
                  {fdMismatchCount} of {fdTotal} mismatched
                </Badge>
              )}
            </div>
            <div>
              <span className="font-medium">Study Session:</span>{" "}
              {ssMismatchCount === 0 ? (
                <Badge variant="secondary">All {ssTotal} match</Badge>
              ) : (
                <Badge variant="destructive">
                  {ssMismatchCount} of {ssTotal} mismatched
                </Badge>
              )}
            </div>
            <div className="ml-auto flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showOnlyMismatches}
                  onChange={(e) => setShowOnlyMismatches(e.target.checked)}
                />
                Show only mismatches
              </label>
              <Button
                variant="outline"
                size="sm"
                disabled={isSyncing}
                onClick={handleHeavySync}
              >
                Heavy Sync (all scholars)
              </Button>
            </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <p className="text-muted-foreground text-sm">
          {isSyncing
            ? syncStatus === "light"
              ? "Running light sync…"
              : "Running heavy sync (all scholars)…"
            : "Loading data…"}
        </p>
      )}

      {!isLoading && fdFiltered && (
        <CollapsibleTableSection
          title={`Front Desk (${fdFiltered.length} rows)`}
          defaultOpen
        >
          <div className="overflow-x-auto">
            <ScholarDataTable
              data={fdFiltered}
              rowKeyField="scholar_uid"
              columns={columns}
              emptyMessage="No front desk data for this week."
              defaultSortColumnId="status"
              defaultSortDirection="asc"
            />
          </div>
        </CollapsibleTableSection>
      )}

      {!isLoading && ssFiltered && (
        <CollapsibleTableSection
          title={`Study Session (${ssFiltered.length} rows)`}
          defaultOpen
        >
          <div className="overflow-x-auto">
            <ScholarDataTable
              data={ssFiltered}
              rowKeyField="scholar_uid"
              columns={columns}
              emptyMessage="No study session data for this week."
              defaultSortColumnId="status"
              defaultSortDirection="asc"
            />
          </div>
        </CollapsibleTableSection>
      )}
    </div>
  );
}
