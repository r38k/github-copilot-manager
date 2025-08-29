import type { Result } from "../utils/result.js";
import { err, ok } from "../utils/result.js";

export type UsageRecord = {
  timestamp: string; // ISO string
  user: string;
  model: string;
  useQuota: number;
  limitMonthlyQuota: number;
  exceedsMonthlyQuota: boolean;
};

export type ParseError = { kind: "InvalidFormat"; message: string; line?: number };

const parseBool = (s: string): boolean => s.trim().toLowerCase() === "true";

export const parseUsageCsv = (text: string): Result<ReadonlyArray<UsageRecord>, ParseError> => {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return ok([]);

  const first = lines[0];
  if (first === undefined) return err({ kind: "InvalidFormat", message: "Empty CSV" });
  const header = first.split(",").map((h) => h.trim());
  const expected = [
    "timestamp",
    "user",
    "model",
    "useQuota",
    "limitMonthlyQuota",
    "exceedsMonthlyQuota",
  ];
  const headerMatches = expected.every((h, i) => header[i] === h);
  if (!headerMatches)
    return err({ kind: "InvalidFormat", message: "Unexpected CSV header" });

  const records: UsageRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (!line.trim()) continue;
    const parts = line.split(",");
    if (parts.length !== expected.length)
      return err({ kind: "InvalidFormat", message: "Wrong column count", line: i + 1 });

    const timestamp = parts[0]!.trim();
    const user = parts[1]!.trim();
    const model = parts[2]!.trim();
    const useQuotaStr = parts[3]!.trim();
    const limitMonthlyQuotaStr = parts[4]!.trim();
    const exceedsStr = parts[5]!.trim();

    const useQuota = Number(useQuotaStr);
    const limitMonthlyQuota = Number(limitMonthlyQuotaStr);
    if (!Number.isFinite(useQuota) || !Number.isFinite(limitMonthlyQuota)) {
      return err({ kind: "InvalidFormat", message: "Non-numeric quota", line: i + 1 });
    }

    const exceedsMonthlyQuota = parseBool(exceedsStr);

    records.push({ timestamp, user, model, useQuota, limitMonthlyQuota, exceedsMonthlyQuota });
  }

  return ok(records);
};
