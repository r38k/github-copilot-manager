import type { Result } from '../utils/result.js';
import { ok, err } from '../utils/result.js';
import { parseUsageCsv } from "../parsers/usage-csv.js";
import type { UserSeat, BillingEstimate } from '../models/types.js';
import type { CsvUploadRecord } from './csv-registry.js';
import { estimateMonthlyCost, monthRangeUtc } from './billing.js';

// CSV データの解析された形式
export type CsvUsageRecord = {
  timestamp: string;
  user: string;
  model: string;
  useQuota: number;
  limitMonthlyQuota: number;
  exceedsMonthlyQuota: boolean;
};

export type CsvData = {
  meta: CsvUploadRecord;
  records: CsvUsageRecord[];
};

// 統合データ型
export type IntegratedData = {
  seats: UserSeat[];
  csvData: CsvData | null;
  billing: BillingEstimate;
  dataSourceStatus: {
    seatsLastUpdated: string;
    csvLastUpdated?: string;
  };
};

// エラー型
export type DataIntegrationError = 
  | { kind: 'SeatsError'; message: string }
  | { kind: 'CsvError'; message: string }
  | { kind: 'BillingError'; message: string };

// 依存サービスのインターフェース
export interface SeatsService {
  loadSeats(): Promise<Result<UserSeat[], { kind: string; message: string }>>;
}

export interface CsvService {
  getLatest(): Promise<Result<CsvUploadRecord | null, { kind: string; message: string }>>;
  getContent(id: string): Promise<Result<string, { kind: string; message: string }>>;
}

export interface BillingService {
  calculateEstimate(seats: UserSeat[]): Result<BillingEstimate, { kind: string; message: string }>;
}

// データ統合サービスのインターフェース
export interface DataIntegrationService {
  getIntegratedData(): Promise<Result<IntegratedData, DataIntegrationError>>;
  refreshData(): Promise<Result<void, DataIntegrationError>>;
}

// CSV解析機能（共通パーサを使用）
const parseCsvContent = (csvContent: string): Result<CsvUsageRecord[], DataIntegrationError> => {
  const parsed = parseUsageCsv(csvContent);
  if (parsed.ok) {
    // 型は一致しているため、そのまま返却
    return ok(parsed.value as CsvUsageRecord[]);
  }
  return err({ kind: 'CsvError', message: parsed.error.message });
};

// データ統合サービス作成関数
export const createDataIntegrationService = (deps: {
  seatsService: SeatsService;
  csvService: CsvService;
  billingService: BillingService;
}): DataIntegrationService => {
  let cachedData: IntegratedData | null = null;

  const getIntegratedData = async (): Promise<Result<IntegratedData, DataIntegrationError>> => {
    // キャッシュがあればそれを返す
    if (cachedData) {
      return ok(cachedData);
    }

    // 新しいデータを取得
    return refreshAndGetData();
  };

  const refreshData = async (): Promise<Result<void, DataIntegrationError>> => {
    const result = await refreshAndGetData();
    if (result.ok) {
      return ok(undefined);
    }
    return err(result.error);
  };

  const refreshAndGetData = async (): Promise<Result<IntegratedData, DataIntegrationError>> => {
    // 座席データの取得
    const seatsResult = await deps.seatsService.loadSeats();
    if (!seatsResult.ok) {
      return err({ 
        kind: 'SeatsError', 
        message: seatsResult.error.message 
      });
    }

    // CSVデータの取得（オプショナル）
    const csvMetaResult = await deps.csvService.getLatest();
    if (!csvMetaResult.ok) {
      return err({ 
        kind: 'CsvError', 
        message: csvMetaResult.error.message 
      });
    }

    let csvData: CsvData | null = null;
    if (csvMetaResult.value) {
      const csvContentResult = await deps.csvService.getContent(csvMetaResult.value.id);
      if (!csvContentResult.ok) {
        return err({ 
          kind: 'CsvError', 
          message: csvContentResult.error.message 
        });
      }

      const parsedResult = parseCsvContent(csvContentResult.value);
      if (!parsedResult.ok) {
        return parsedResult;
      }

      csvData = {
        meta: csvMetaResult.value,
        records: parsedResult.value,
      };
    }

    // 課金見積もりの計算
    const billingResult = deps.billingService.calculateEstimate(seatsResult.value);
    if (!billingResult.ok) {
      return err({ 
        kind: 'BillingError', 
        message: billingResult.error.message 
      });
    }

    // 統合データの作成
    const integratedData: IntegratedData = {
      seats: seatsResult.value,
      csvData,
      billing: billingResult.value,
      dataSourceStatus: {
        seatsLastUpdated: new Date().toISOString(),
        ...(csvData?.meta.uploadedAt
          ? { csvLastUpdated: csvData.meta.uploadedAt.toISOString() }
          : {}),
      },
    };

    // キャッシュに保存
    cachedData = integratedData;

    return ok(integratedData);
  };

  return {
    getIntegratedData,
    refreshData,
  };
};

// デフォルト実装のファクトリー関数（デモデータ使用）
export const createDefaultDataIntegrationService = (csvService: CsvService): DataIntegrationService => {
  const seatsService: SeatsService = {
    async loadSeats() {
      const { loadDemoSeats } = await import('../api/seats.js');
      const res = loadDemoSeats();
      if (res.ok) {
        // ReadonlyArray を可変配列に変換して型を満たす
        return ok([...res.value]);
      }
      return res as any;
    }
  };

  const billingService: BillingService = {
    calculateEstimate(seats: UserSeat[]) {
      const now = new Date();
      const range = monthRangeUtc(now.getFullYear(), now.getMonth() + 1);
      const estimate = estimateMonthlyCost(seats, range);
      return ok(estimate);
    }
  };

  return createDataIntegrationService({
    seatsService,
    csvService,
    billingService,
  });
};

// 実GitHub API使用のファクトリー関数
export const createGitHubDataIntegrationService = (
  csvService: CsvService, 
  org: string, 
  token?: string
): DataIntegrationService => {
  const seatsService: SeatsService = {
    async loadSeats() {
      const { createGitHubSeatsService } = await import('../api/github.js');
      const githubService = createGitHubSeatsService(token);
      return githubService.loadSeats(org);
    }
  };

  const billingService: BillingService = {
    calculateEstimate(seats: UserSeat[]) {
      const now = new Date();
      const range = monthRangeUtc(now.getFullYear(), now.getMonth() + 1);
      const estimate = estimateMonthlyCost(seats, range);
      return ok(estimate);
    }
  };

  return createDataIntegrationService({
    seatsService,
    csvService,
    billingService,
  });
};

// 自動選択のファクトリー関数（環境変数に応じてGitHub APIまたはデモデータを使用）
export const createAutoDataIntegrationService = (csvService: CsvService): DataIntegrationService => {
  const githubToken = process.env.GITHUB_TOKEN;
  const githubOrg = process.env.GITHUB_ORG;

  if (githubToken && githubOrg) {
    console.log(`Using GitHub API for organization: ${githubOrg}`);
    return createGitHubDataIntegrationService(csvService, githubOrg, githubToken);
  } else {
    console.log('Using demo data (set GITHUB_TOKEN and GITHUB_ORG for real API)');
    return createDefaultDataIntegrationService(csvService);
  }
};
