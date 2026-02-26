import "server-only";
import { createClient } from "@/lib/supabase/server";
import { campusWeekToDateRange } from "@/lib/time";
import type { McfFormLogRow, WhafFormLogRow, WplFormLogRow } from "./types";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** End of the last day of the week (inclusive) for created_at queries. */
function getWeekFetchEnd(range: { endDate: Date }): Date {
  return new Date(range.endDate.getTime() + ONE_DAY_MS - 1);
}

// ---- MCF (Mentor Check-in Form) ----

export async function getMcfFormLogsForWeek(
  weekNum: number
): Promise<McfFormLogRow[]> {
  const range = campusWeekToDateRange(weekNum);
  if (!range) return [];
  const supabase = await createClient();
  const endDate = getWeekFetchEnd(range);
  const { data, error } = await supabase
    .from("mcf_form_logs")
    .select("*")
    .gte("created_at", range.startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as McfFormLogRow[];
}

/** Rows where mentor_uid or mentee_uid equals the given uid. */
export async function getMcfFormLogsByUid(uid: string): Promise<McfFormLogRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mcf_form_logs")
    .select("*")
    .or(`mentor_uid.eq.${uid},mentee_uid.eq.${uid}`)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as McfFormLogRow[];
}

/** MCF logs for a given uid within a campus week. */
export async function getMcfFormLogsByUidAndWeek(
  uid: string,
  weekNum: number
): Promise<McfFormLogRow[]> {
  const range = campusWeekToDateRange(weekNum);
  if (!range) return [];
  const supabase = await createClient();
  const endDate = getWeekFetchEnd(range);
  const { data, error } = await supabase
    .from("mcf_form_logs")
    .select("*")
    .or(`mentor_uid.eq.${uid},mentee_uid.eq.${uid}`)
    .gte("created_at", range.startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as McfFormLogRow[];
}

// ---- WHAF (Weekly Honors Academic Form) ----
// No uid column; only by week.

export async function getWhafFormLogsForWeek(
  weekNum: number
): Promise<WhafFormLogRow[]> {
  const range = campusWeekToDateRange(weekNum);
  if (!range) return [];
  const supabase = await createClient();
  const endDate = getWeekFetchEnd(range);
  const { data, error } = await supabase
    .from("whaf_form_logs")
    .select("*")
    .gte("created_at", range.startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as WhafFormLogRow[];
}

// ---- WPL (Work Placement Log) ----

export async function getWplFormLogsForWeek(
  weekNum: number
): Promise<WplFormLogRow[]> {
  const range = campusWeekToDateRange(weekNum);
  if (!range) return [];
  const supabase = await createClient();
  const endDate = getWeekFetchEnd(range);
  const { data, error } = await supabase
    .from("wpl_form_logs")
    .select("*")
    .gte("created_at", range.startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as WplFormLogRow[];
}

export async function getWplFormLogsByUid(uid: string): Promise<WplFormLogRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wpl_form_logs")
    .select("*")
    .eq("scholar_uid", uid)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as WplFormLogRow[];
}

/** WPL logs for a given scholar_uid within a campus week. */
export async function getWplFormLogsByUidAndWeek(
  uid: string,
  weekNum: number
): Promise<WplFormLogRow[]> {
  const range = campusWeekToDateRange(weekNum);
  if (!range) return [];
  const supabase = await createClient();
  const endDate = getWeekFetchEnd(range);
  const { data, error } = await supabase
    .from("wpl_form_logs")
    .select("*")
    .eq("scholar_uid", uid)
    .gte("created_at", range.startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as WplFormLogRow[];
}
