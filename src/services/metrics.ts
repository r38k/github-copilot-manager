import type { UsageRecord } from "../parsers/usage-csv.js";

export type UserMonthlyUsage = ReadonlyMap<string, number>;

export const sumUsageByUser = (records: ReadonlyArray<UsageRecord>): UserMonthlyUsage => {
  const acc = new Map<string, number>();
  for (const r of records) {
    const prev = acc.get(r.user) ?? 0;
    acc.set(r.user, prev + r.useQuota);
  }
  return acc;
};

export const usersExceedingMonthlyQuota = (
  records: ReadonlyArray<UsageRecord>
): ReadonlySet<string> => {
  const s = new Set<string>();
  for (const r of records) {
    if (r.exceedsMonthlyQuota) s.add(r.user);
  }
  return s;
};

