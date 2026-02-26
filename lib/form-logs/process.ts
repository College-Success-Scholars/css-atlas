/**
 * Processing helpers: attach isLate to form log rows using Eastern-time deadlines.
 * Client-safe; use with rows from lib/server/form-logs or any object with created_at.
 */

import { isWhafLate, isMcfLate, isWplLate } from "./deadlines";

/** Row with created_at and optional isLate (after processing). */
export type FormLogRowWithLate<T> = T & { isLate: boolean };

/**
 * Mark each WHAF row with isLate (true if submitted after Thursday 23:59 EST of that week).
 */
export function markWhafFormLogsLate<T extends { created_at: string | null }>(
  rows: T[]
): FormLogRowWithLate<T>[] {
  return rows.map((row) => ({
    ...row,
    isLate:
      row.created_at != null && row.created_at !== ""
        ? isWhafLate(row.created_at)
        : false,
  }));
}

/**
 * Mark each MCF row with isLate (true if submitted after Friday 17:00 EST of that week).
 */
export function markMcfFormLogsLate<T extends { created_at: string | null }>(
  rows: T[]
): FormLogRowWithLate<T>[] {
  return rows.map((row) => ({
    ...row,
    isLate:
      row.created_at != null && row.created_at !== ""
        ? isMcfLate(row.created_at)
        : false,
  }));
}

/**
 * Mark each WPL row with isLate (true if submitted after Friday 17:00 EST of that week).
 */
export function markWplFormLogsLate<T extends { created_at: string | null }>(
  rows: T[]
): FormLogRowWithLate<T>[] {
  return rows.map((row) => ({
    ...row,
    isLate:
      row.created_at != null && row.created_at !== ""
        ? isWplLate(row.created_at)
        : false,
  }));
}
