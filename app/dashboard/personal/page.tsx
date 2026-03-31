import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  FileText,
  ClipboardList,
  AlertCircle
} from "lucide-react"
import { ActivityLog } from "@/components/dashboard/activity-log"
import { getCurrentUserWithProfilesRow } from "@/lib/supabase/server"
import { getCurrentWeekPersonalFormStatuses } from "@/lib/server/personal-monitoring"

function displayName(profile: {
  full_name: string | null
  first_name: string | null
  last_name: string | null
} | null): string {
  if (!profile) return "Unknown user"
  const full = profile.full_name?.trim()
  if (full) return full
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || "Unknown user"
}

function displayRole(role: string | null | undefined): string {
  const r = role?.trim()
  return r ? r : "—"
}

function displayTeams(teams: string[] | null | undefined): string {
  if (!teams || teams.length === 0) return "No team assigned"
  return teams.join(", ")
}

export default async function PersonalMonitoringPage() {
  const { user, profile } = await getCurrentUserWithProfilesRow()
  if (!user) redirect("/auth/login")
  const personalFormStatuses = await getCurrentWeekPersonalFormStatuses({
    profile,
    userEmail: user.email ?? null,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Personal Monitoring</h1>
        <p className="text-muted-foreground">
          Track your personal progress, form submissions, and activities
        </p>
        <div className="mt-3 space-y-1 text-sm">
          <p className="font-medium text-foreground">
            Name: <span className="font-semibold">{displayName(profile)}</span>
          </p>
          <p className="font-medium text-foreground">
            Role: <span className="font-semibold">{displayRole(profile?.program_role)}</span>
          </p>
          <p className="text-muted-foreground">
            Team: <span className="font-medium text-foreground">{displayTeams(profile?.teams)}</span>
          </p>
        </div>
      </div>

      {/* Form Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {personalFormStatuses.map((form) => (
          <Card key={form.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{form.name} Status</CardTitle>
              {form.name === "WPL" && <FileText className="h-4 w-4 text-muted-foreground" />}
              {form.name === "MCF" && <ClipboardList className="h-4 w-4 text-muted-foreground" />}
              {form.name === "WHAF" && <AlertCircle className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge 
                  variant={
                    form.status === "completed" ? "default" : "destructive"
                  }
                >
                  {form.status === "completed" ? "Completed" : "Incomplete"}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  <p>{form.detail}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Log */}
      <ActivityLog />
    </div>
  )
}
