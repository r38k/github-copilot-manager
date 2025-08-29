import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { isOk } from "../utils/result.js";
import { parseUsageCsv } from "../parsers/usage-csv.js";
import { sumUsageByUser, usersExceedingMonthlyQuota } from "./metrics.js";

const loadDemo = () => {
  const csv = readFileSync("data/demo-usage.csv", "utf8");
  const parsed = parseUsageCsv(csv);
  if (!isOk(parsed)) throw new Error("failed to parse demo CSV");
  return parsed.value;
};

describe("metrics", () => {
  it("aggregates total useQuota by user", () => {
    const records = loadDemo();
    const totals = sumUsageByUser(records);
    // simple spot checks against known demo values
    const tanakaTotal = records
      .filter((r) => r.user === "tanaka.taro")
      .reduce((s, r) => s + r.useQuota, 0);
    expect(totals.get("tanaka.taro")).toBe(tanakaTotal);

    // should include multiple distinct users
    expect(totals.size).toBeGreaterThan(5);
  });

  it("finds users exceeding monthly quota", () => {
    const records = loadDemo();
    const exceeding = usersExceedingMonthlyQuota(records);
    // from demo data, at least these two appear exceeding once
    expect(exceeding.has("takahashi.mei")).toBe(true);
    expect(exceeding.has("sato.ichiro")).toBe(true);
  });
});

