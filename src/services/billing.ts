import type { BillingEstimate, DateRange, UserSeat } from "../models/types.js";

const parseNumber = (s: string | undefined | null): number | undefined => {
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

export const defaultUnitPrice = (): number => parseNumber(process.env.COPILOT_PRICE_PER_MONTH) ?? 19;

export const isActiveInCycle = (seat: UserSeat, range: DateRange): boolean => {
  const assigned = new Date(seat.assignedAt);
  const cancelled = seat.pendingCancellationDate ? new Date(seat.pendingCancellationDate) : null;
  return assigned <= range.end && (!cancelled || cancelled >= range.start);
};

export const estimateMonthlyCost = (
  seats: ReadonlyArray<UserSeat>,
  range: DateRange,
  unitPrice = defaultUnitPrice()
): BillingEstimate => {
  const active = seats.filter((s) => isActiveInCycle(s, range));
  const activeCount = active.length;
  const cost = activeCount * unitPrice;
  return {
    activeUserCount: activeCount,
    unitPrice,
    estimatedCost: cost,
    calculationMethod: "simplified",
    confidence: "medium",
    disclaimers: [
      "概算値です。実際の請求額と差異が生じる可能性があります",
      "日割り計算は含まれていません",
      "月途中の加入・脱退による調整は反映されていません",
    ],
  };
};

export const monthRangeUtc = (year: number, month1to12: number): DateRange => {
  const start = new Date(Date.UTC(year, month1to12 - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month1to12, 0, 23, 59, 59));
  return { start, end };
};

