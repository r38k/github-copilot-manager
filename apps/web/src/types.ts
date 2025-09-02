export type CsvUsageRecord = {
  timestamp: string
  user: string
  model: string
  useQuota: number
  limitMonthlyQuota: number
  exceedsMonthlyQuota: boolean
}

export type CsvData = {
  meta: { id: string; uploadedAt: string }
  records: CsvUsageRecord[]
  totalUsers?: number
  exceedingUsers?: number
}

export type UserSeat = {
  userId: number
  login: string
  assignedAt: string
  lastActivityAt?: string
  pendingCancellationDate?: string
}

export type BillingEstimate = {
  estimatedCost: number
  activeUserCount: number
  disclaimers: string[]
}

export type IntegratedData = {
  seats: UserSeat[]
  csvData: CsvData | null
  billing: BillingEstimate
  dataSourceStatus: Record<string, unknown>
}

