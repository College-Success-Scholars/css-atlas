import type { CleanedAndErroredResult } from "./types";

/**
 * Pure enrichment: add scholar names to a cleaned-and-errored result using a pre-fetched name map.
 * Safe to call from client or server. The name map is typically fetched server-side (e.g. in API routes).
 */
export function enrichCleanedAndErroredWithNames(
  result: CleanedAndErroredResult,
  nameMap: Map<string, string>
): CleanedAndErroredResult {
  const enrichedByScholarUid = new Map(result.byScholarUid);
  for (const [uid, data] of enrichedByScholarUid) {
    enrichedByScholarUid.set(uid, {
      ...data,
      scholarName: nameMap.get(uid) ?? null,
    });
  }
  return { ...result, byScholarUid: enrichedByScholarUid };
}

/**
 * Pure enrichment: add scholar names to items using a pre-fetched name map.
 * Safe to call from client or server.
 */
export function enrichWithScholarNames<
  T extends { scholarUid: string; scholarName?: string | null },
>(items: T[], nameMap: Map<string, string>): T[] {
  if (items.length === 0) return items;
  return items.map((r) => ({
    ...r,
    scholarName: nameMap.get(r.scholarUid) ?? null,
  }));
}
