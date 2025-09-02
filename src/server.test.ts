import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Hono } from 'hono';
import type { Result } from '../utils/result.js';

// テスト対象の型定義（実装前）
export type IntegratedData = {
  seats: Array<{
    login: string;
    userId: number;
    assignedAt: string;
    lastActivityAt: string | null;
    pendingCancellationDate: string | null;
  }>;
  csvData: {
    records: Array<{
      timestamp: string;
      user: string;
      model: string;
      useQuota: number;
      limitMonthlyQuota: number;
      exceedsMonthlyQuota: boolean;
    }>;
    totalUsers: number;
    exceedingUsers: number;
  } | null;
  billing: {
    activeUserCount: number;
    unitPrice: number;
    estimatedCost: number;
    disclaimers: string[];
  };
  dataSourceStatus: {
    csvLastUpdated?: string;
    apiLastFetched: string;
  };
};

export interface DataService {
  getIntegratedData(): Promise<Result<IntegratedData, { kind: string; message: string }>>;
}

describe('Web Server API', () => {
  let app: Hono;
  let mockDataService: DataService;

  beforeEach(async () => {
    // モックデータサービス
    mockDataService = {
      getIntegratedData: vi.fn(),
    };

    const { createServer } = await import('./index.js');
    app = createServer(mockDataService);
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const req = new Request('http://localhost/api/health');
      const res = await app.fetch(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('status', 'ok');
      expect(data).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/data', () => {
    it('should return integrated data when service succeeds', async () => {
      const mockData: IntegratedData = {
        seats: [{
          login: 'test-user',
          userId: 1,
          assignedAt: '2024-01-01T00:00:00Z',
          lastActivityAt: '2024-01-15T00:00:00Z',
          pendingCancellationDate: null,
        }],
        csvData: {
          records: [{
            timestamp: '2024-01-01T00:00:00Z',
            user: 'test-user',
            model: 'gpt-4',
            useQuota: 100,
            limitMonthlyQuota: 500,
            exceedsMonthlyQuota: false,
          }],
          totalUsers: 1,
          exceedingUsers: 0,
        },
        billing: {
          activeUserCount: 1,
          unitPrice: 19,
          estimatedCost: 19,
          disclaimers: ['Estimated cost only'],
        },
        dataSourceStatus: {
          csvLastUpdated: '2024-01-01T00:00:00Z',
          apiLastFetched: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(mockDataService.getIntegratedData).mockResolvedValue({
        ok: true,
        value: mockData,
      });

      const req = new Request('http://localhost/api/data');
      const res = await app.fetch(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(mockData);
    });

    it('should return error when service fails', async () => {
      vi.mocked(mockDataService.getIntegratedData).mockResolvedValue({
        ok: false,
        error: { kind: 'DataError', message: 'Failed to load data' },
      });

      const req = new Request('http://localhost/api/data');
      const res = await app.fetch(req);

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data).toHaveProperty('error', 'Failed to load data');
    });
  });

  describe('POST /api/csv/upload', () => {
    it('should upload CSV file and return metadata', async () => {
      const timestamp = Date.now();
      const csvContent = `timestamp,user,model\n2024-01-01,user-${timestamp},gpt-4`;
      const filename = `test-${timestamp}.csv`;
      const formData = new FormData();
      formData.append('file', new Blob([csvContent], { type: 'text/csv' }), filename);
      formData.append('uploadedBy', 'test-user');

      const req = new Request('http://localhost/api/csv/upload', {
        method: 'POST',
        body: formData,
      });
      const res = await app.fetch(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('filename', filename);
      expect(data).toHaveProperty('uploadedBy', 'test-user');
    });

    it('should reject invalid CSV content', async () => {
      const invalidContent = 'not a csv';
      const formData = new FormData();
      formData.append('file', new Blob([invalidContent], { type: 'text/csv' }), 'invalid.csv');

      const req = new Request('http://localhost/api/csv/upload', {
        method: 'POST',
        body: formData,
      });
      const res = await app.fetch(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid CSV format');
    });

    it('should reject non-CSV files', async () => {
      const textContent = 'some text content';
      const formData = new FormData();
      formData.append('file', new Blob([textContent], { type: 'text/plain' }), 'test.txt');

      const req = new Request('http://localhost/api/csv/upload', {
        method: 'POST',
        body: formData,
      });
      const res = await app.fetch(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Only CSV files are allowed');
    });
  });

  describe('GET /api/csv/list', () => {
    it('should return list of uploaded CSV files', async () => {
      const req = new Request('http://localhost/api/csv/list');
      const res = await app.fetch(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('DELETE /api/csv/:id', () => {
    it('should delete CSV file', async () => {
      // まずファイルをアップロード
      const csvContent = `timestamp,user\n2024-01-01,user-delete-${Date.now()}`;
      const formData = new FormData();
      formData.append('file', new Blob([csvContent], { type: 'text/csv' }), `test-delete-${Date.now()}.csv`);

      const uploadReq = new Request('http://localhost/api/csv/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadRes = await app.fetch(uploadReq);
      expect(uploadRes.status).toBe(200);
      
      const uploadData = await uploadRes.json();
      const fileId = uploadData.id;

      // ファイルを削除
      const deleteReq = new Request(`http://localhost/api/csv/${fileId}`, {
        method: 'DELETE',
      });
      const res = await app.fetch(deleteReq);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('deleted', true);
    });

    it('should return 404 for non-existent file', async () => {
      const req = new Request('http://localhost/api/csv/non-existent', {
        method: 'DELETE',
      });
      const res = await app.fetch(req);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /', () => {
    it('should return landing page that redirects to /app/', async () => {
      // / はデータに依存せず、SPA へ誘導
      const req = new Request('http://localhost/');
      const res = await app.fetch(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/html');
      const html = await res.text();
      expect(html).toContain('GitHub Copilot Manager');
      expect(html).toContain('/app/');
    });
  });
});
