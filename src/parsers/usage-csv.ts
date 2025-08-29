import type { Result } from "../utils/result.js";
import { err, ok } from "../utils/result.js";
import { HEADER_ALIASES, REQUIRED_HEADERS, type UsageHeader } from "./usage-headers.js";

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
  const rawHeaders = first.split(",").map((h) => h.trim());
  // 別名解決して、正規化キー → インデックスのマップを作る
  const indexByKey = new Map<UsageHeader, number>();
  for (let i = 0; i < rawHeaders.length; i++) {
    const key = HEADER_ALIASES[rawHeaders[i]!.toLowerCase()];
    if (key) indexByKey.set(key, i);
  }
  const missing = REQUIRED_HEADERS.filter((k) => !indexByKey.has(k));
  if (missing.length > 0) {
    return err({
      kind: "InvalidFormat",
      message: `Missing required columns: ${missing.join(", ")}`,
    });
  }

  const records: UsageRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (!line.trim()) continue;
    const parts = line.split(",");
    const tsIdx = indexByKey.get("timestamp")!;
    const userIdx = indexByKey.get("user")!;
    const modelIdx = indexByKey.get("model")!;
    const usageIdx = indexByKey.get("useQuota")!;
    const limitIdx = indexByKey.get("limitMonthlyQuota")!;
    const exceededIdx = indexByKey.get("exceedsMonthlyQuota")!;

    const timestamp = (parts[tsIdx] ?? "").trim();
    const user = (parts[userIdx] ?? "").trim();
    const model = (parts[modelIdx] ?? "").trim();
    const useQuotaStr = (parts[usageIdx] ?? "").trim();
    const limitMonthlyQuotaStr = (parts[limitIdx] ?? "").trim();
    const exceedsStr = (parts[exceededIdx] ?? "").trim();

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
