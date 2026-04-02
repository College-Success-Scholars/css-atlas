import "server-only";
import { createClient, type ProfilesRow } from "@/lib/supabase/server";

export type ActivityFormType = "WHAF" | "WPL" | "MCF";

export type RecentFormSubmission = {
  id: string;
  formType: ActivityFormType;
  submittedAt: string | null;
  assignment_grades?: unknown;
  course_changes?: string | null;
  missed_classes?: string | null;
  missed_assignments?: string | null;
  course_change_details?: string | null;
  hours_worked?: number | null;
  projects?: unknown;
  met_with_all?: string | null;
  explanation?: string | null;
  mentee_name?: string | null;
  meeting_date?: string | null;
  meeting_time?: string | null;
  met_in_person?: string | null;
  tasks_completed?: string | null;
  meeting_notes?: string | null;
  needs_tutor?: string | null;
};

export async function getRecentFormSubmissions(params: {
  profile: ProfilesRow | null;
  userEmail: string | null;
  perFormLimit?: number;
}): Promise<RecentFormSubmission[]> {
  const { profile, userEmail, perFormLimit = 3 } = params;
  const profileIdCandidate = typeof profile?.id === "string" ? profile.id : null;
  const studentIdCandidate =
    typeof profile?.student_id === "number" ? String(profile.student_id) : null;
  const uid = studentIdCandidate ?? profileIdCandidate;
  const normalizedEmail = userEmail?.trim().toLowerCase() ?? null;
  const supabase = await createClient();

  const whafBase = supabase
    .from("whaf_form_logs")
    .select(
      "id, created_at, assignment_grades, course_changes, missed_classes, missed_assignments, course_change_details"
    )
    .order("created_at", { ascending: false })
    .limit(perFormLimit);
  const wplBase = supabase
    .from("wpl_form_logs")
    .select("id, created_at, hours_worked, projects, met_with_all, explanation")
    .order("created_at", { ascending: false })
    .limit(perFormLimit);
  const mcfBase = supabase
    .from("mcf_form_logs")
    .select(
      "id, created_at, mentee_name, meeting_date, meeting_time, met_in_person, tasks_completed, meeting_notes, needs_tutor"
    )
    .order("created_at", { ascending: false })
    .limit(perFormLimit);

  const [whafRes, wplRes, mcfRes] = await Promise.all([
    uid
      ? whafBase.eq("scholar_uid", uid)
      : whafBase.eq("submitted_by_email", normalizedEmail ?? "__no_email__"),
    uid
      ? wplBase.eq("scholar_uid", uid)
      : wplBase.eq("submitted_by_email", normalizedEmail ?? "__no_email__"),
    uid
      ? mcfBase.or(`mentor_uid.eq.${uid},mentee_uid.eq.${uid}`)
      : mcfBase.eq("submitted_by_email", normalizedEmail ?? "__no_email__"),
  ]);

  const whafRows = (whafRes.data ?? []).map(
    (row): RecentFormSubmission => ({
      id: `WHAF-${row.id}`,
      formType: "WHAF",
      submittedAt: row.created_at,
      assignment_grades: row.assignment_grades,
      course_changes: row.course_changes,
      missed_classes: row.missed_classes,
      missed_assignments: row.missed_assignments,
      course_change_details: row.course_change_details,
    })
  );
  const wplRows = (wplRes.data ?? []).map(
    (row): RecentFormSubmission => ({
      id: `WPL-${row.id}`,
      formType: "WPL",
      submittedAt: row.created_at,
      hours_worked: row.hours_worked,
      projects: row.projects,
      met_with_all: row.met_with_all,
      explanation: row.explanation,
    })
  );
  const mcfRows = (mcfRes.data ?? []).map(
    (row): RecentFormSubmission => ({
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
    })
  );

  return [...whafRows, ...wplRows, ...mcfRows].sort((a, b) => {
    const aTs = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const bTs = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
    return bTs - aTs;
  });
}
