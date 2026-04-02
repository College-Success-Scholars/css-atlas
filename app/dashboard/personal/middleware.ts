import "server-only"

import {
  getMcfFormLogsByUid,
  getMcfFormLogsByUidAndWeek,
  getWhafFormLogsByUid,
  getWplFormLogsByUid,
  getWplFormLogsByUidAndWeek,
} from "@/lib/server/form-logs"
import { campusWeekToDateRange, dateToCampusWeek, EASTERN_TIMEZONE } from "@/lib/time"
import type { ProfilesRow } from "@/lib/supabase/server"

export type PersonalFormStatus = {
  name: "WPL" | "MCF" | "WHAF"
  status: "completed" | "incomplete"
  detail: string
}

export type CurrentWeekContext = {
  weekNumber: number | null
  weekStartDate: Date | null
  weekEndDate: Date | null
  label: string
}

export type ActivityFormType = "WHAF" | "WPL" | "MCF"

export type RecentFormSubmission = {
  id: string
  formType: ActivityFormType
  submittedAt: string | null
  assignment_grades?: unknown
  course_changes?: string | null
  missed_classes?: string | null
  missed_assignments?: string | null
  course_change_details?: string | null
  hours_worked?: number | null
  projects?: unknown
  met_with_all?: string | null
  explanation?: string | null
  mentee_name?: string | null
  meeting_date?: string | null
  meeting_time?: string | null
  met_in_person?: string | null
  tasks_completed?: string | null
  meeting_notes?: string | null
  needs_tutor?: string | null
}

/** Resolves the student UID string used to query form logs from a profile row. */
function uidFromProfile(profile: ProfilesRow | null): string | null {
  const profileIdCandidate = typeof profile?.student_id === "string" ? profile.student_id : null
  const studentIdCandidate =
    typeof profile?.student_id === "number" ? String(profile.student_id) : null
  return studentIdCandidate ?? profileIdCandidate
}

/** Returns the campus week number, its Eastern date range, and a short label for “today”. */
export function getCurrentWeekContext(): CurrentWeekContext {
  const weekNumber = dateToCampusWeek(new Date())
  if (typeof weekNumber !== "number") {
    return {
      weekNumber: null,
      weekStartDate: null,
      weekEndDate: null,
      label: "Current week unavailable",
    }
  }

  const range = campusWeekToDateRange(weekNumber)
  return {
    weekNumber,
    weekStartDate: range?.startDate ?? null,
    weekEndDate: range?.endDate ?? null,
    label: `Week ${weekNumber}`,
  }
}

/** Builds a human-readable range like “Week 3: Jan 5 - Jan 11” in Eastern time. */
export function formatCampusWeekRangeLabel(
  weekStartDate: Date | null,
  weekEndDate: Date | null,
  weekNumber: number | null
): string {
  if (
    weekNumber == null ||
    weekStartDate == null ||
    weekEndDate == null
  ) {
    return "Current week unavailable"
  }

  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    timeZone: EASTERN_TIMEZONE,
  }
  const start = new Intl.DateTimeFormat("en-US", opts).format(weekStartDate)
  const end = new Intl.DateTimeFormat("en-US", opts).format(weekEndDate)
  return `Week ${weekNumber}: ${start} - ${end}`
}

/** Loads whether WPL, MCF, and WHAF were submitted for the current campus week for this user. */
export async function getCurrentWeekPersonalFormStatuses(params: {
  profile: ProfilesRow | null
}): Promise<PersonalFormStatus[]> {
  const { profile } = params
  const { weekNumber: weekNum, label: currentWeekLabel } = getCurrentWeekContext()

  if (typeof weekNum !== "number") {
    return [
      { name: "WPL", status: "incomplete", detail: currentWeekLabel },
      { name: "MCF", status: "incomplete", detail: currentWeekLabel },
      { name: "WHAF", status: "incomplete", detail: currentWeekLabel },
    ]
  }

  const uid = uidFromProfile(profile)

  let mcfSubmitted = false
  let wplSubmitted = false
  let whafSubmitted = false

  if (uid) {
    const [mcfRows, wplRows, whafRows] = await Promise.all([
      getMcfFormLogsByUidAndWeek(uid, weekNum),
      getWplFormLogsByUidAndWeek(uid, weekNum),
      getWhafFormLogsByUid(uid),
    ])
    console.log(getCurrentWeekContext())
    console.log("mcfRows", mcfRows)
    console.log("wplRows", wplRows)
    console.log("whafRows", whafRows)

    mcfSubmitted = mcfRows.length > 0
    wplSubmitted = wplRows.length > 0
    whafSubmitted = whafRows.some(
      (row) =>
        row.created_at &&
        dateToCampusWeek(new Date(row.created_at)) === weekNum
    )
  }

  return [
    { name: "WPL", status: wplSubmitted ? "completed" : "incomplete", detail: currentWeekLabel },
    { name: "MCF", status: mcfSubmitted ? "completed" : "incomplete", detail: currentWeekLabel },
    { name: "WHAF", status: whafSubmitted ? "completed" : "incomplete", detail: currentWeekLabel },
  ]
}

/** Copies rows and sorts by `created_at` descending (missing timestamps sort last). */
function sortByCreatedAtDesc<T extends { created_at: string | null }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aTs = a.created_at ? new Date(a.created_at).getTime() : 0
    const bTs = b.created_at ? new Date(b.created_at).getTime() : 0
    return bTs - aTs
  })
}

/** Fetches the latest WHAF, WPL, and MCF submissions per form (capped), merged and sorted by time. */
export async function getRecentFormSubmissions(params: {
  profile: ProfilesRow | null
  perFormLimit?: number
}): Promise<RecentFormSubmission[]> {
  const { profile, perFormLimit = 3 } = params
  const uid = uidFromProfile(profile)

  if (!uid) {
    return []
  }

  const [whafAll, wplAll, mcfAll] = await Promise.all([
    getWhafFormLogsByUid(uid),
    getWplFormLogsByUid(uid),
    getMcfFormLogsByUid(uid),
  ])

  const whafRows = sortByCreatedAtDesc(whafAll).slice(0, perFormLimit)
  const wplRows = sortByCreatedAtDesc(wplAll).slice(0, perFormLimit)
  const mcfRows = sortByCreatedAtDesc(mcfAll).slice(0, perFormLimit)

  const whafMapped: RecentFormSubmission[] = whafRows.map((row) => ({
    id: `WHAF-${row.id}`,
    formType: "WHAF",
    submittedAt: row.created_at,
    assignment_grades: row.assignment_grades,
    course_changes: row.course_changes,
    missed_classes: row.missed_classes,
    missed_assignments: row.missed_assignments,
    course_change_details: row.course_change_details,
  }))
  const wplMapped: RecentFormSubmission[] = wplRows.map((row) => ({
    id: `WPL-${row.id}`,
    formType: "WPL",
    submittedAt: row.created_at,
    hours_worked: row.hours_worked,
    projects: row.projects,
    met_with_all: row.met_with_all,
    explanation: row.explanation,
  }))
  const mcfMapped: RecentFormSubmission[] = mcfRows.map((row) => ({
    id: `MCF-${row.id}`,
    formType: "MCF",
    submittedAt: row.created_at,
    mentee_name: row.mentee_name,
    meeting_date: row.meeting_date,
    meeting_time: row.meeting_time,
    met_in_person: row.met_in_person,
    tasks_completed: row.tasks_completed,
    meeting_notes: row.meeting_notes,
    needs_tutor: row.needs_tutor,
  }))

  return [...whafMapped, ...wplMapped, ...mcfMapped].sort((a, b) => {
    const aTs = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
    const bTs = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
    return bTs - aTs
  })
}
