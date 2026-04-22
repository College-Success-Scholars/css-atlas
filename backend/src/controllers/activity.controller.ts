import type { Response } from "express";
import type { AuthenticatedRequest } from "./auth.controller.js";
import { getTotalMinutesForMenteeWeek, getActivityRowsForWeek } from "../services/daily-scholar-activity.service.js";

// GET /api/daily-activity/minutes?menteeUid=X&weekNum=Y&logSource=Z
export async function minutes(req: AuthenticatedRequest, res: Response) {
  try {
    const menteeUid = req.query.menteeUid as string | undefined;
    const weekNumStr = req.query.weekNum as string | undefined;
    const logSource = req.query.logSource as string | undefined;
    if (!menteeUid || !weekNumStr || !logSource) {
      res.status(400).json({ error: "Missing required query parameters: menteeUid, weekNum, logSource" });
      return;
    }
    const weekNum = parseInt(weekNumStr, 10);
    if (Number.isNaN(weekNum) || weekNum < 1) {
      res.status(400).json({ error: "Invalid weekNum" }); return;
    }
    const data = await getTotalMinutesForMenteeWeek({ menteeUid, weekNum, logSource });
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to fetch activity minutes" });
  }
}

// GET /api/daily-activity/week/:weekNum
export async function activityForWeek(req: AuthenticatedRequest, res: Response) {
  try {
    const weekNum = parseInt(req.params.weekNum as string, 10);
    if (Number.isNaN(weekNum) || weekNum < 1) {
      res.status(400).json({ error: "Invalid weekNum parameter" });
      return;
    }
    const data = await getActivityRowsForWeek(weekNum);
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to fetch activity rows" });
  }
}
