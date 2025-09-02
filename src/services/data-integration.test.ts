import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Result } from '../utils/result.js';
import type { UserSeat } from '../models/types.js';
import type { CsvUploadMeta } from './csv-upload.test.js';

// テスト対象の型定義（実装前）
export type DataIntegrationError = 
  | { kind: 'SeatsError'; message: string }
  | { kind: 'CsvError'; message: string }
  | { kind: 'BillingError'; message: string };

export interface DataIntegrationService {
  getIntegratedData(): Promise<Result<any, DataIntegrationError>>;
  refreshData(): Promise<Result<void, DataIntegrationError>>;
}

// 依存サービスのモック型
export interface SeatsService {
  loadSeats(): Promise<Result<UserSeat[], { kind: string; message: string }>>;
}

export interface CsvService {
  getLatest(): Promise<Result<CsvUploadMeta | null, { kind: string; message: string }>>;
  getContent(id: string): Promise<Result<string, { kind: string; message: string }>>;
}

export interface BillingService {
  calculateEstimate(seats: UserSeat[]): Result<any, { kind: string; message: string }>;
}

describe('DataIntegrationService', () => {
  let integrationService: DataIntegrationService;
  let mockSeatsService: SeatsService;
  let mockCsvService: CsvService;
  let mockBillingService: BillingService;

  beforeEach(async () => {
    // モック依存サービス
    mockSeatsService = {
      loadSeats: vi.fn(),
    };
    
    mockCsvService = {
      getLatest: vi.fn(),
      getContent: vi.fn(),
    };
    
    mockBillingService = {
      calculateEstimate: vi.fn(),
    };

    const { createDataIntegrationService } = await import('./data-integration.js');
    integrationService = createDataIntegrationService({
      seatsService: mockSeatsService,
      csvService: mockCsvService,
      billingService: mockBillingService,
    });
  });

  describe('getIntegratedData', () => {
    it('should integrate seats, CSV, and billing data successfully', async () => {
      const mockSeats: UserSeat[] = [
        {
          login: 'user1',
          userId: 1,
          assignedAt: '2024-01-01T00:00:00Z',
          lastActivityAt: '2024-01-15T00:00:00Z',
          pendingCancellationDate: null,
        },
        {
          login: 'user2',
          userId: 2,
          assignedAt: '2024-01-01T00:00:00Z',
          lastActivityAt: null,
          pendingCancellationDate: null,
        },
      ];

      const mockCsvMeta: CsvUploadMeta = {
        id: 'csv-123',
        filename: 'usage.csv',
        size: 1000,
        contentHash: 'abc123',
        uploadedAt: new Date('2024-01-01T00:00:00Z'),
        uploadedBy: 'admin',
      };

      const mockCsvContent = 'timestamp,user,model,useQuota,limitMonthlyQuota,exceedsMonthlyQuota\n2024-01-01T00:00:00Z,user1,gpt-4,100,500,false';

      const mockBilling = {
        activeUserCount: 1,
        unitPrice: 19,
        estimatedCost: 19,
        disclaimers: ['Estimated cost only'],
      };

      vi.mocked(mockSeatsService.loadSeats).mockResolvedValue({
        ok: true,
        value: mockSeats,
      });

      vi.mocked(mockCsvService.getLatest).mockResolvedValue({
        ok: true,
        value: mockCsvMeta,
      });

      vi.mocked(mockCsvService.getContent).mockResolvedValue({
        ok: true,
        value: mockCsvContent,
      });

      vi.mocked(mockBillingService.calculateEstimate).mockReturnValue({
        ok: true,
        value: mockBilling,
      });

      const result = await integrationService.getIntegratedData();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.seats).toHaveLength(2);
        expect(result.value.csvData).toBeDefined();
        expect(result.value.csvData?.records).toHaveLength(1);
        expect(result.value.billing).toEqual(mockBilling);
        expect(result.value.dataSourceStatus).toBeDefined();
        expect(result.value.dataSourceStatus.csvLastUpdated).toBe('2024-01-01T00:00:00.000Z');
      }
    });

    it('should work with API-only data when CSV is not available', async () => {
      const mockSeats: UserSeat[] = [
        {
          login: 'user1',
          userId: 1,
          assignedAt: '2024-01-01T00:00:00Z',
          lastActivityAt: '2024-01-15T00:00:00Z',
          pendingCancellationDate: null,
        },
      ];

      const mockBilling = {
        activeUserCount: 1,
        unitPrice: 19,
        estimatedCost: 19,
        disclaimers: ['Estimated cost only'],
      };

      vi.mocked(mockSeatsService.loadSeats).mockResolvedValue({
        ok: true,
        value: mockSeats,
      });

      vi.mocked(mockCsvService.getLatest).mockResolvedValue({
        ok: true,
        value: null, // CSVなし
      });

      vi.mocked(mockBillingService.calculateEstimate).mockReturnValue({
        ok: true,
        value: mockBilling,
      });

      const result = await integrationService.getIntegratedData();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.seats).toHaveLength(1);
        expect(result.value.csvData).toBeNull();
        expect(result.value.billing).toEqual(mockBilling);
        expect(result.value.dataSourceStatus.csvLastUpdated).toBeUndefined();
      }
    });

    it('should return error when seats service fails', async () => {
      vi.mocked(mockSeatsService.loadSeats).mockResolvedValue({
        ok: false,
        error: { kind: 'ReadError', message: 'Failed to load seats' },
      });

      const result = await integrationService.getIntegratedData();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe('SeatsError');
        expect(result.error.message).toBe('Failed to load seats');
      }
    });

    it('should return error when CSV content is invalid', async () => {
      const mockSeats: UserSeat[] = [];
      const mockCsvMeta: CsvUploadMeta = {
        id: 'csv-123',
        filename: 'invalid.csv',
        size: 100,
        contentHash: 'abc123',
        uploadedAt: new Date(),
      };

      vi.mocked(mockSeatsService.loadSeats).mockResolvedValue({
        ok: true,
        value: mockSeats,
      });

      vi.mocked(mockCsvService.getLatest).mockResolvedValue({
        ok: true,
        value: mockCsvMeta,
      });

      vi.mocked(mockCsvService.getContent).mockResolvedValue({
        ok: true,
        value: 'invalid csv content',
      });

      const result = await integrationService.getIntegratedData();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe('CsvError');
      }
    });
  });

  describe('refreshData', () => {
    it('should refresh and cache integrated data', async () => {
      const mockSeats: UserSeat[] = [];
      const mockBilling = {
        activeUserCount: 0,
        unitPrice: 19,
        estimatedCost: 0,
        disclaimers: [],
      };

      vi.mocked(mockSeatsService.loadSeats).mockResolvedValue({
        ok: true,
        value: mockSeats,
      });

      vi.mocked(mockCsvService.getLatest).mockResolvedValue({
        ok: true,
        value: null,
      });

      vi.mocked(mockBillingService.calculateEstimate).mockReturnValue({
        ok: true,
        value: mockBilling,
      });

      const result = await integrationService.refreshData();

      expect(result.ok).toBe(true);
      
      // データが更新されていることを確認
      const dataResult = await integrationService.getIntegratedData();
      expect(dataResult.ok).toBe(true);
    });

    it('should return error when refresh fails', async () => {
      vi.mocked(mockSeatsService.loadSeats).mockResolvedValue({
        ok: false,
        error: { kind: 'ReadError', message: 'API error' },
      });

      const result = await integrationService.refreshData();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe('SeatsError');
      }
    });
  });
});
