import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { Result } from '../utils/result';

// テスト対象の型定義（実装前）
export type CsvUploadMeta = {
  id: string;
  filename: string;
  size: number;
  contentHash: string;
  uploadedAt: Date;
  uploadedBy?: string;
};

export type CsvUploadError = 
  | { kind: 'ValidationError'; message: string }
  | { kind: 'StorageError'; message: string }
  | { kind: 'DuplicateError'; message: string };

export interface CsvUploadService {
  upload(content: string, filename: string, uploadedBy?: string): Promise<Result<CsvUploadMeta, CsvUploadError>>;
  list(): Promise<Result<ReadonlyArray<CsvUploadMeta>, CsvUploadError>>;
  get(id: string): Promise<Result<CsvUploadMeta | null, CsvUploadError>>;
  getContent(id: string): Promise<Result<string | null, CsvUploadError>>;
  delete(id: string): Promise<Result<boolean, CsvUploadError>>;
}

describe('CsvUploadService', () => {
  let testDir: string;
  let uploadService: CsvUploadService;

  beforeEach(async () => {
    // テスト用の一時ディレクトリを作成
    testDir = join(tmpdir(), `csv-upload-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    
    const { createFileSystemUploadService } = await import('./csv-upload.js');
    uploadService = createFileSystemUploadService(testDir);
  });

  afterEach(async () => {
    // テスト用ディレクトリを削除
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('upload', () => {
    it('should upload CSV content and return metadata', async () => {
      const content = 'timestamp,user,model\n2024-01-01,user1,gpt-4';
      const filename = 'test.csv';
      const uploadedBy = 'test-user';

      const result = await uploadService.upload(content, filename, uploadedBy);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.filename).toBe(filename);
        expect(result.value.size).toBe(content.length);
        expect(result.value.uploadedBy).toBe(uploadedBy);
        expect(result.value.id).toBeDefined();
        expect(result.value.contentHash).toBeDefined();
        expect(result.value.uploadedAt).toBeInstanceOf(Date);
      }
    });

    it('should validate CSV content format', async () => {
      const invalidContent = 'not a csv';
      const filename = 'invalid.csv';

      const result = await uploadService.upload(invalidContent, filename);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe('ValidationError');
        expect(result.error.message).toContain('Invalid CSV format');
      }
    });

    it('should reject non-CSV files', async () => {
      const content = 'some content';
      const filename = 'test.txt';

      const result = await uploadService.upload(content, filename);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe('ValidationError');
        expect(result.error.message).toContain('Only CSV files are allowed');
      }
    });

    it('should handle duplicate content uploads', async () => {
      const content = 'timestamp,user,model\n2024-01-01,user1,gpt-4';
      const filename1 = 'test1.csv';
      const filename2 = 'test2.csv';

      // 最初のアップロード
      const result1 = await uploadService.upload(content, filename1);
      expect(result1.ok).toBe(true);

      // 同じコンテンツの2回目のアップロード
      const result2 = await uploadService.upload(content, filename2);
      expect(result2.ok).toBe(false);
      if (!result2.ok) {
        expect(result2.error.kind).toBe('DuplicateError');
      }
    });
  });

  describe('list', () => {
    it('should return empty list initially', async () => {
      const result = await uploadService.list();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });

    it('should return uploaded files sorted by upload date (newest first)', async () => {
      const content1 = 'timestamp,user\n2024-01-01,user1';
      const content2 = 'timestamp,user\n2024-01-02,user2';

      await uploadService.upload(content1, 'file1.csv');
      // 少し待って異なるタイムスタンプにする
      await new Promise(resolve => setTimeout(resolve, 10));
      await uploadService.upload(content2, 'file2.csv');

      const result = await uploadService.list();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]?.filename).toBe('file2.csv');
        expect(result.value[1]?.filename).toBe('file1.csv');
      }
    });
  });

  describe('get', () => {
    it('should return metadata for existing file', async () => {
      const content = 'timestamp,user\n2024-01-01,user1';
      const uploadResult = await uploadService.upload(content, 'test.csv');
      
      if (!uploadResult.ok) throw new Error('Upload failed');
      const id = uploadResult.value.id;

      const result = await uploadService.get(id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value?.id).toBe(id);
        expect(result.value?.filename).toBe('test.csv');
      }
    });

    it('should return null for non-existent file', async () => {
      const result = await uploadService.get('non-existent-id');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('getContent', () => {
    it('should return content for existing file', async () => {
      const content = 'timestamp,user\n2024-01-01,user1';
      const uploadResult = await uploadService.upload(content, 'test.csv');
      
      if (!uploadResult.ok) throw new Error('Upload failed');
      const id = uploadResult.value.id;

      const result = await uploadService.getContent(id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(content);
      }
    });

    it('should return null for non-existent file', async () => {
      const result = await uploadService.getContent('non-existent-id');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('delete', () => {
    it('should delete existing file', async () => {
      const content = 'timestamp,user\n2024-01-01,user1';
      const uploadResult = await uploadService.upload(content, 'test.csv');
      
      if (!uploadResult.ok) throw new Error('Upload failed');
      const id = uploadResult.value.id;

      const deleteResult = await uploadService.delete(id);
      expect(deleteResult.ok).toBe(true);
      if (deleteResult.ok) {
        expect(deleteResult.value).toBe(true);
      }

      // ファイルが削除されていることを確認
      const getResult = await uploadService.get(id);
      expect(getResult.ok).toBe(true);
      if (getResult.ok) {
        expect(getResult.value).toBeNull();
      }
    });

    it('should return false for non-existent file', async () => {
      const result = await uploadService.delete('non-existent-id');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });
  });
});