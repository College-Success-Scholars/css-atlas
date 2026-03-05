/**
 * Traffic server module. For client-safe types and pure utilities, use @/lib/traffic.
 */

import { campusWeekToDateRange } from "@/lib/time";
import {
  getTrafficSessions,
  getEntryCountByWeek,
  type TrafficSession,
} from "@/lib/traffic";
import { getWeekFetchEnd } from "@/lib/session-records";
import { fetchTrafficLogs } from "./fetch";

export { fetchTrafficLogs, requireTrafficFetchLimit } from "./fetch";

export async function getTrafficSessionsForWeek(
  weekNumber: number
): Promise<TrafficSession[]> {
  const range = campusWeekToDateRange(weekNumber);
  if (!range) return [];
  const endDate = getWeekFetchEnd(range);
  const rows = await fetchTrafficLogs({
    startDate: range.startDate,
    endDate,
  });
  return getTrafficSessions(rows);
}

export async function getTrafficEntryCountForWeek(
  weekNumber: number
): Promise<number> {
  const range = campusWeekToDateRange(weekNumber);
  if (!range) return 0;
  const endDate = getWeekFetchEnd(range);
  const rows = await fetchTrafficLogs({
    startDate: range.startDate,
    endDate,
  });
  return getEntryCountByWeek(rows, weekNumber);
}

export type WeekEntryCount = { weekNumber: number; entryCount: number };

/**
 * Entry counts per week for the given week numbers. Fetches each week with a
 * separate request so every week is fresh (no stale batch/cache). For use in
 * line chart etc.
 */
export async function getTrafficEntryCountsForWeeks(
  weekNumbers: number[]
): Promise<WeekEntryCount[]> {
  if (weekNumbers.length === 0) return [];
  const counts = await Promise.all(
    weekNumbers.map((weekNumber) => getTrafficEntryCountForWeek(weekNumber))
  );
  return weekNumbers.map((weekNumber, i) => ({
    weekNumber,
    entryCount: counts[i],
  }));
}
