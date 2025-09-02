import { Hono } from 'hono';
import { serveStatic } from 'hono/serve-static';
import { serve } from '@hono/node-server';
import type { Result } from './utils/result.js';
import { fileSystemCsvRegistry } from './services/csv-registry.js';
import { createAutoDataIntegrationService } from './services/data-integration.js';
import type { IntegratedData } from './services/data-integration.js';
import { sumUsageByUser, usersExceedingMonthlyQuota } from './services/metrics.js';
import { createFileSystemUploadService } from './services/csv-upload.js';
// SSR ダッシュボード関連の依存は削除

// データサービスのインターフェース
export interface DataService {
  getIntegratedData(): Promise<Result<IntegratedData, { kind: string; message: string }>>;
}

// データサービスの実装
const createDataService = (): DataService => {
  const csvRegistry = fileSystemCsvRegistry('data');
  const csvUploadService = createFileSystemUploadService('uploads');
  
  const csvService = {
    async getLatest() {
      // まずアップロードされたCSVをチェック
      const uploadedResult = await csvUploadService.list();
      if (uploadedResult.ok) {
        const arr = uploadedResult.value;
        if (arr.length > 0) {
          const latest = arr[0]!;
          return { ok: true, value: {
            id: latest.id,
            filename: latest.filename,
            size: latest.size,
            contentHash: latest.contentHash,
            uploadedAt: latest.uploadedAt,
          }} as const;
        }
      }
      
      // アップロードされたCSVがない場合はdataディレクトリから取得
      const result = csvRegistry.latest();
      return result.ok 
        ? { ok: true, value: result.value || null } as const
        : { ok: false, error: { kind: result.error.kind, message: result.error.message } } as const;
    },
    async getContent(id: string) {
      // まずアップロードされたCSVから試す
      const uploadedContent = await csvUploadService.getContent(id);
      if (uploadedContent.ok && uploadedContent.value) {
        return { ok: true, value: uploadedContent.value } as const;
      }
      
      // アップロードされたCSVになければdataディレクトリから取得
      const result = csvRegistry.loadContent(id);
      return result.ok 
        ? { ok: true, value: result.value } as const
        : { ok: false, error: { kind: result.error.kind, message: result.error.message } } as const;
    }
  };

  const integrationService = createAutoDataIntegrationService(csvService);

  return {
    async getIntegratedData() {
      const result = await integrationService.getIntegratedData();
      if (result.ok) {
        // CSV データがある場合は統計を追加
        let enhancedCsvData = result.value.csvData;
        if (enhancedCsvData) {
          const totals = sumUsageByUser(enhancedCsvData.records);
          const exceeding = usersExceedingMonthlyQuota(enhancedCsvData.records);
          enhancedCsvData = {
            ...enhancedCsvData,
            totalUsers: totals.size,
            exceedingUsers: exceeding.size,
          } as any;
        }

        const enhancedData: IntegratedData = {
          ...result.value,
          csvData: enhancedCsvData,
          dataSourceStatus: {
            ...result.value.dataSourceStatus,
            apiLastFetched: result.value.dataSourceStatus.seatsLastUpdated,
          } as any,
        };

        return { ok: true, value: enhancedData } as const;
      }
      return result;
    }
  };
};

// サーバー作成関数
export const createServer = (dataService: DataService = createDataService()) => {
  const app = new Hono();

  // ヘルスチェック
  app.get('/api/health', (c) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  // 統合データの取得
  app.get('/api/data', async (c) => {
    const result = await dataService.getIntegratedData();
    if (result.ok) {
      return c.json(result.value);
    }
    return c.json({ error: result.error.message }, 500);
  });

  // CSV操作エンドポイント
  const csvUploadService = createFileSystemUploadService('uploads');

  app.post('/api/csv/upload', async (c) => {
    const body = await c.req.parseBody();
    const file = body.file as File;
    const uploadedBy = body.uploadedBy as string | undefined;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    if (!file.name.endsWith('.csv')) {
      return c.json({ error: 'Only CSV files are allowed' }, 400);
    }

    const content = await file.text();
    const result = await csvUploadService.upload(content, file.name, uploadedBy);

    if (result.ok) {
      return c.json(result.value);
    }

    const status = result.error.kind === 'ValidationError' ? 400 : 500;
    return c.json({ error: result.error.message }, status);
  });

  app.get('/api/csv/list', async (c) => {
    const result = await csvUploadService.list();
    if (result.ok) {
      return c.json(result.value);
    }
    return c.json({ error: result.error.message }, 500);
  });

  app.delete('/api/csv/:id', async (c) => {
    const id = c.req.param('id');
    const result = await csvUploadService.delete(id);
    
    if (result.ok) {
      if (result.value) {
        return c.json({ deleted: true });
      } else {
        return c.json({ error: 'File not found' }, 404);
      }
    }
    
    return c.json({ error: result.error.message }, 500);
  });

  // HTMLダッシュボード（SSR）は撤去し、/app へ誘導
  app.get('/', (c) => {
    const html = `<!doctype html>
    <html lang="ja">
      <head>
        <meta charset=\"UTF-8\" />
        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
        <title>GitHub Copilot Manager</title>
        <meta http-equiv=\"refresh\" content=\"0; url=/app/\" />
        <style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,system-ui,sans-serif;margin:40px;background:#f5f5f5}</style>
      </head>
      <body>
        <p>アプリに移動します… <a href=\"/app/\">/app/ を開く</a></p>
      </body>
    </html>`;
    return c.html(html);
  });

  // SPA (CSR) を /app で提供（apps/web/dist を想定）
  app.get('/app', (c) => c.redirect('/app/'));
  // 型の差異を回避するため明示キャスト
  app.get('/app/*', serveStatic({ root: 'apps/web/dist' } as any));

  return app;
};

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createServer();
  const port = Number(process.env.PORT) || 3000;
  
  console.log(`Using demo data (set GITHUB_TOKEN and GITHUB_ORG for real API)`);
  console.log(`Starting GitHub Copilot Manager server on http://localhost:${port}`);
  
  serve({
    fetch: app.fetch,
    port,
  });
}
