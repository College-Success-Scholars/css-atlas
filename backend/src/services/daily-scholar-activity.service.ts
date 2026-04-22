import { getSupabaseClient } from "./supabase.service.js";
import { campusWeekToDateRange, EASTERN_TIMEZONE } from "./time.service.js";
import type { DailyScholarActivityMinutesRow, DailyScholarActivityRow } from "../models/daily-scholar-activity.model.js";

const MINUTES_COLUMN = "duration_minutes" as const;

function formatDateYMD(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: EASTERN_TIMEZONE });
}

export async function getTotalMinutesForMenteeWeek(params: {
  menteeUid: string;
  weekNum: number;
  logSource: string;
}): Promise<number> {
  const { menteeUid, weekNum, logSource } = params;
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("daily_scholar_activity")
    .select(MINUTES_COLUMN)
    .eq("scholar_uid", menteeUid)
    .eq("week_num", weekNum)
    .eq("log_source", logSource);

  if (error) throw error;

  const rows = (data ?? []) as DailyScholarActivityMinutesRow[];
  return rows.reduce((sum, row) => sum + (row.duration_minutes ?? 0), 0);
}

export async function getActivityRowsForWeek(weekNum: number): Promise<DailyScholarActivityRow[]> {
  const range = campusWeekToDateRange(weekNum);
  if (!range) return [];
  const supabase = getSupabaseClient();

  const startStr = formatDateYMD(range.startDate);
  const endStr = formatDateYMD(range.endDate);

  const { data, error } = await supabase
    .from("daily_scholar_activity")
    .select("scholar_uid, activity_date, log_source, duration_minutes")
    .gte("activity_date", startStr)
    .lte("activity_date", endStr)
    .order("scholar_uid", { ascending: true });

  if (error) throw error;
  return (data ?? []) as DailyScholarActivityRow[];
}
