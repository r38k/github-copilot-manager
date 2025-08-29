// 正規化された内部ヘッダー名
export type UsageHeader =
  | "timestamp"
  | "user"
  | "model"
  | "useQuota"
  | "limitMonthlyQuota"
  | "exceedsMonthlyQuota";

export const REQUIRED_HEADERS: ReadonlyArray<UsageHeader> = [
  "timestamp",
  "user",
  "model",
  "useQuota",
  "limitMonthlyQuota",
  "exceedsMonthlyQuota",
] as const;

// 別名 → 正規化名 のマップ（小文字で照合）
export const HEADER_ALIASES: Readonly<Record<string, UsageHeader>> = {
  // timestamp
  timestamp: "timestamp",
  time: "timestamp",
  date: "timestamp",
  datetime: "timestamp",

  // user
  user: "user",
  username: "user",
  login: "user",
  user_login: "user",

  // model
  model: "model",
  model_name: "model",

  // usage (useQuota)
  usequota: "useQuota",
  usage: "useQuota",
  used: "useQuota",
  used_quota: "useQuota",
  credits_used: "useQuota",

  // monthly limit (limitMonthlyQuota)
  limitmonthlyquota: "limitMonthlyQuota",
  monthly_quota: "limitMonthlyQuota",
  monthly_limit: "limitMonthlyQuota",
  quota_limit: "limitMonthlyQuota",

  // exceeded flag (exceedsMonthlyQuota)
  exceedsmonthlyquota: "exceedsMonthlyQuota",
  exceeded: "exceedsMonthlyQuota",
  exceeded_monthly_quota: "exceedsMonthlyQuota",
  is_exceeded: "exceedsMonthlyQuota",
} as const;

