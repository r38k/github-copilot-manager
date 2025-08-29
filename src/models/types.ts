export type UserId = number;

export type UserSeat = {
  login: string;
  userId: UserId;
  assignedAt: string; // ISO
  pendingCancellationDate: string | null; // ISO or null
  lastActivityAt: string | null; // ISO or null
};

export type BillingEstimate = {
  activeUserCount: number;
  unitPrice: number;
  estimatedCost: number;
  calculationMethod: "simplified";
  confidence: "medium";
  disclaimers: ReadonlyArray<string>;
};

export type DateRange = { start: Date; end: Date };

