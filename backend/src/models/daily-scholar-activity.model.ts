/**
 * Types for public.daily_scholar_activity table.
 */

export type DailyScholarLogSource = string;

export interface DailyScholarActivityMinutesRow {
  duration_minutes: number | null;
}

export interface DailyScholarActivityRow {
  scholar_uid: string;
  activity_date: string;
  log_source: string;
  duration_minutes: number;
}
