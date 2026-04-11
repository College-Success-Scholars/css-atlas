import { createClient } from "@/lib/supabase/server"
import { getISOWeek } from "date-fns";
import { MenteeMonitoringClient } from "@/components/mentee-monitoring/mentee-monitoring-client";
import { getActiveSemester, getMyMentees } from "@/lib/server/queries";

export default async function MenteePage() {
  const supabase = await createClient();

  // Both cached — semester from Data Cache, mentees per-request.
  const [semester, mentees] = await Promise.all([
    getActiveSemester(),
    getMyMentees(),
  ]);

  const menteeUids = mentees.map((m) => m.scholar_uid).filter(Boolean) as string[];

  // Mentee-specific data requires UIDs, so this second step is unavoidable.
  const [activityResult, wahfResult, tutoringResult] = await Promise.allSettled([
    supabase.from('daily_scholar_activity').select('*').in('scholar_uid', menteeUids),
    supabase.from('whaf_form_logs').select('*').in('scholar_uid', menteeUids),
    supabase.from('tutor_report_logs').select('*').in('scholar_uid', menteeUids),
  ])

  // Process the results
  const activity = activityResult.status === 'fulfilled' ? (activityResult.value.data ?? []) : [];
  const wahf     = wahfResult.status     === 'fulfilled' ? (wahfResult.value.data     ?? []) : [];
  const tutoring = tutoringResult.status === 'fulfilled' ? (tutoringResult.value.data ?? []) : [];

  const currentIsoWeek = getISOWeek(new Date(Date.now()));

  return (
    <div className="space-y-6">
      <MenteeMonitoringClient
        mentees={mentees}
        activity={activity}
        wahf={wahf}
        tutoring={tutoring}
        semester={semester}
        currentIsoWeek={currentIsoWeek}
      />
    </div>
  )
}
