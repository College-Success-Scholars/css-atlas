import "server-only";
import {
  markWhafFormLogsLate,
  markMcfFormLogsLate,
  markWplFormLogsLate,
  type FormLogRowWithLate,
} from "@/lib/form-logs";
import type { McfFormLogRow, WhafFormLogRow, WplFormLogRow } from "./types";
import {
  getMcfFormLogsForWeek,
  getMcfFormLogsByUid,
  getMcfFormLogsByUidAndWeek,
  getWhafFormLogsForWeek,
  getWplFormLogsForWeek,
  getWplFormLogsByUid,
  getWplFormLogsByUidAndWeek,
} from "./fetch";

export type WhafFormLogRowWithLate = FormLogRowWithLate<WhafFormLogRow>;
export type McfFormLogRowWithLate = FormLogRowWithLate<McfFormLogRow>;
export type WplFormLogRowWithLate = FormLogRowWithLate<WplFormLogRow>;

export async function getWhafFormLogsForWeekWithLate(
  weekNum: number
): Promise<WhafFormLogRowWithLate[]> {
  const rows = await getWhafFormLogsForWeek(weekNum);
  return markWhafFormLogsLate(rows);
}

export async function getMcfFormLogsForWeekWithLate(
  weekNum: number
): Promise<McfFormLogRowWithLate[]> {
  const rows = await getMcfFormLogsForWeek(weekNum);
  return markMcfFormLogsLate(rows);
}

export async function getMcfFormLogsByUidWithLate(
  uid: string
): Promise<McfFormLogRowWithLate[]> {
  const rows = await getMcfFormLogsByUid(uid);
  return markMcfFormLogsLate(rows);
}

export async function getMcfFormLogsByUidAndWeekWithLate(
  uid: string,
  weekNum: number
): Promise<McfFormLogRowWithLate[]> {
  const rows = await getMcfFormLogsByUidAndWeek(uid, weekNum);
  return markMcfFormLogsLate(rows);
}

export async function getWplFormLogsForWeekWithLate(
  weekNum: number
): Promise<WplFormLogRowWithLate[]> {
  const rows = await getWplFormLogsForWeek(weekNum);
  return markWplFormLogsLate(rows);
}

export async function getWplFormLogsByUidWithLate(
  uid: string
): Promise<WplFormLogRowWithLate[]> {
  const rows = await getWplFormLogsByUid(uid);
  return markWplFormLogsLate(rows);
}

export async function getWplFormLogsByUidAndWeekWithLate(
  uid: string,
  weekNum: number
): Promise<WplFormLogRowWithLate[]> {
  const rows = await getWplFormLogsByUidAndWeek(uid, weekNum);
  return markWplFormLogsLate(rows);
}
