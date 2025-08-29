import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { isOk } from "../utils/result.js";
import { parseUsageCsv } from "./usage-csv.js";

describe("parseUsageCsv", () => {
  it("parses demo CSV into records", () => {
    const csv = readFileSync("data/demo-usage.csv", "utf8");
    const res = parseUsageCsv(csv);
    expect(isOk(res)).toBe(true);
    if (!isOk(res)) return;
    expect(res.value.length).toBeGreaterThan(0);
    const first = res.value[0];
    expect(first).toMatchObject({
      user: expect.any(String),
      model: expect.any(String),
      exceedsMonthlyQuota: expect.any(Boolean),
    });
  });

  it("fails on malformed header", () => {
    const bad = "time,user\n2024-01-01,alice";
    const res = parseUsageCsv(bad);
    expect(res.ok).toBe(false);
  });
});

