import { describe, it, expect } from "vitest";
import { loadDemoSeats } from "../api/seats.js";
import { isOk } from "../utils/result.js";
import { estimateMonthlyCost, monthRangeUtc, isActiveInCycle } from "./billing.js";
import { readFileSync } from "node:fs";

describe("billing estimate (simplified)", () => {
  it("counts active seats within December 2024 cycle", () => {
    const seatsRes = loadDemoSeats();
    if (!isOk(seatsRes)) throw new Error("failed to load demo seats");
    const seats = seatsRes.value;
    const range = monthRangeUtc(2024, 12);

    const activeCount = seats.filter((s) => isActiveInCycle(s, range)).length;

    // Cross-check with demo metrics file if available
    const metrics = JSON.parse(readFileSync("data/demo-api-metrics.json", "utf8")) as any;
    const expected = metrics?.seat_breakdown?.active_this_cycle;
    if (typeof expected === "number") {
      expect(activeCount).toBe(expected);
    } else {
      // Fallback: at least one active user exists
      expect(activeCount).toBeGreaterThan(0);
    }

    const estimate = estimateMonthlyCost(seats, range, 19);
    expect(estimate.activeUserCount).toBe(activeCount);
    expect(estimate.estimatedCost).toBeCloseTo(activeCount * 19, 6);
  });
});

