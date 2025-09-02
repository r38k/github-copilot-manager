import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { UserSeat } from "../models/types.js";
import type { Result } from "../utils/result.js";
import { err, ok } from "../utils/result.js";

type DemoSeat = {
  created_at: string;
  pending_cancellation_date: string | null;
  last_activity_at: string | null;
  assignee: { login: string; id: number };
};

type DemoSeatsFile = {
  total_seats: number;
  seats: DemoSeat[];
};

export type LoadSeatsError = { kind: "ReadError"; message: string } | { kind: "ParseError"; message: string };

export const loadDemoSeats = (filePath = resolve("data/demo-api-seats.json")): Result<ReadonlyArray<UserSeat>, LoadSeatsError> => {
  try {
    const raw = readFileSync(filePath, "utf8");
    const json = JSON.parse(raw) as DemoSeatsFile;
    const seats: UserSeat[] = (json.seats ?? []).map((s) => ({
      login: s.assignee.login,
      userId: s.assignee.id,
      assignedAt: s.created_at,
      pendingCancellationDate: s.pending_cancellation_date,
      lastActivityAt: s.last_activity_at,
    }));
    return ok(seats);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes("json")) return err({ kind: "ParseError", message: msg });
    return err({ kind: "ReadError", message: msg });
  }
};

