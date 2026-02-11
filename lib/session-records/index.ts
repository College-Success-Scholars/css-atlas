/**
 * Session records: client-safe types and pure utilities (weekly minutes, date helpers).
 * For server-side data and sync (Supabase), use lib/server/session-records or app/api routes.
 */

export type { FrontDeskRecordRow, StudySessionRecordRow } from "./types";

export { getWeekFetchEnd, EMPTY_WEEKLY_MINUTES } from "./utils";

export { computeWeeklyMinutesByUid } from "./weekly-minutes";

export type { WeeklyMinutesByDay, WeekDateRange } from "./weekly-minutes";
