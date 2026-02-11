import { getDeveloperUser } from "@/lib/supabase/server";
import { getStudySessionRecord } from "@/lib/server/session-records";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getDeveloperUser();
  if (!user) {
    return NextResponse.json(
      { error: "Forbidden: Developer access required" },
      { status: 403 }
    );
  }
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");
  const week = searchParams.get("week");
  if (!uid || !week) {
    return NextResponse.json(
      { error: "Missing uid or week query parameter" },
      { status: 400 }
    );
  }
  const uidNum = parseInt(uid, 10);
  const weekNum = parseInt(week, 10);
  if (Number.isNaN(uidNum) || Number.isNaN(weekNum) || weekNum < 1) {
    return NextResponse.json(
      { error: "Invalid uid or week" },
      { status: 400 }
    );
  }
  try {
    const data = await getStudySessionRecord(uidNum, weekNum);
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch record" },
      { status: 500 }
    );
  }
}
