import { createClient } from "@/lib/supabase/server"
import { getISOWeek } from "date-fns";
import { PersonalClient } from "@/components/personal/personal-client";

export default async function PersonalPage() {
  
  const supabase = await createClient();

  const [semesterRes, menteesRes, userRes] = await Promise.all([
    supabase.from('semesters').select('iso_week_offset, start_date, end_date').eq('is_active', true).single(),
    supabase.rpc('get_my_mentees'),
    supabase.auth.getUser(),
  ])
  
  if (semesterRes.error || !semesterRes.data) throw new Error('No active semester found')
  if (menteesRes.error || !menteesRes.data?.length) throw new Error('Unable to fetch mentees')
  if (userRes.error || !userRes.data?.user) throw new Error('Unable to fetch user')
  
  const semester = semesterRes.data
  const user = userRes.data.user

  const {data: profile, error: profileError} = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profileError || !profile) throw new Error('Unable to fetch profile')

  // Get the WAHF, MCF, and WPL logs
  const [wahfResult, mcfResult, wplResult] = await Promise.allSettled([
    supabase.from('whaf_form_logs').select('*').eq('scholar_uid', profile.student_id),
    supabase.from('mcf_form_logs').select('*').eq('mentor_uid', profile.student_id),
    supabase.from('wpl_form_logs').select('*').eq('scholar_uid', profile.student_id)
  ])

  // Process the results
  const wahf = wahfResult.status === 'fulfilled' ? (wahfResult.value.data ?? []) : []
  const mcf = mcfResult.status === 'fulfilled' ? (mcfResult.value.data ?? []) : []
  const wpl = wplResult.status === 'fulfilled' ? (wplResult.value.data ?? []) : []
  const currentIsoWeek = getISOWeek(new Date(Date.now()));

  return (
    <div className="space-y-6">
      <PersonalClient
        profile={profile}
        wahf={wahf} 
        mcf={mcf}
        wpl={wpl}
        semester={semester}
        currentIsoWeek={currentIsoWeek}
      />
    </div>
  )
}