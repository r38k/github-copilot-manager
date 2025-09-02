import { promises as fs } from 'node:fs';
import { join, extname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import type { Result } from '../utils/result.js';
import { ok, err } from '../utils/result.js';

// CSV アップロードのメタデータ型
export type CsvUploadMeta = {
  id: string;
  filename: string;
  size: number;
  contentHash: string;
  uploadedAt: Date;
  uploadedBy?: string;
};

// CSV アップロードエラー型
export type CsvUploadError = 
  | { kind: 'ValidationError'; message: string }
  | { kind: 'StorageError'; message: string }
  | { kind: 'DuplicateError'; message: string };

// CSV アップロードサービスのインターフェース
export interface CsvUploadService {
  upload(content: string, filename: string, uploadedBy?: string): Promise<Result<CsvUploadMeta, CsvUploadError>>;
  list(): Promise<Result<ReadonlyArray<CsvUploadMeta>, CsvUploadError>>;
  get(id: string): Promise<Result<CsvUploadMeta | null, CsvUploadError>>;
  getContent(id: string): Promise<Result<string | null, CsvUploadError>>;
  delete(id: string): Promise<Result<boolean, CsvUploadError>>;
}

// SHA256ハッシュ計算
const calculateHash = (content: string): string => {
  return createHash('sha256').update(content, 'utf8').digest('hex');
};

// CSV形式の基本バリデーション
const validateCsvContent = (content: string): Result<void, CsvUploadError> => {
  if (!content.trim()) {
    return err({ kind: 'ValidationError', message: 'CSV content cannot be empty' });
  }

  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    return err({ kind: 'ValidationError', message: 'Invalid CSV format: must have header and at least one data row' });
  }

  // ヘッダー行のチェック
  const header = lines[0];
  if (!header || !header.includes(',')) {
    return err({ kind: 'ValidationError', message: 'Invalid CSV format: header must contain comma-separated fields' });
  }

  return ok(undefined);
};

// ファイル名バリデーション
const validateFilename = (filename: string): Result<void, CsvUploadError> => {
  if (extname(filename).toLowerCase() !== '.csv') {
    return err({ kind: 'ValidationError', message: 'Only CSV files are allowed' });
  }
  return ok(undefined);
};

// メタデータファイル管理
type MetadataFile = {
  uploads: Record<string, CsvUploadMeta>;
};

// ファイルシステムベースのCSVアップロードサービス
export const createFileSystemUploadService = (uploadDir: string): CsvUploadService => {
  const metadataFile = join(uploadDir, '.metadata.json');

  // メタデータを読み込む
  const loadMetadata = async (): Promise<Result<MetadataFile, CsvUploadError>> => {
    try {
      const data = await fs.readFile(metadataFile, 'utf8');
      const metadata = JSON.parse(data) as MetadataFile;
      
      // 日付文字列をDateオブジェクトに変換
      for (const upload of Object.values(metadata.uploads)) {
        upload.uploadedAt = new Date(upload.uploadedAt);
      }
      
      return ok(metadata);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        return ok({ uploads: {} });
      }
      return err({ 
        kind: 'StorageError', 
        message: `Failed to read metadata: ${(e as Error).message}` 
      });
    }
  };

  // メタデータを保存する
  const saveMetadata = async (metadata: MetadataFile): Promise<Result<void, CsvUploadError>> => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2), 'utf8');
      return ok(undefined);
    } catch (e) {
      return err({ 
        kind: 'StorageError', 
        message: `Failed to save metadata: ${(e as Error).message}` 
      });
    }
  };

  // ファイルパスを取得
  const getFilePath = (id: string): string => join(uploadDir, `${id}.csv`);

  const upload = async (
    content: string, 
    filename: string, 
    uploadedBy?: string
  ): Promise<Result<CsvUploadMeta, CsvUploadError>> => {
    // ファイル名バリデーション
    const filenameResult = validateFilename(filename);
    if (!filenameResult.ok) return filenameResult;

    // CSV内容バリデーション
    const contentResult = validateCsvContent(content);
    if (!contentResult.ok) return contentResult;

    // メタデータ読み込み
    const metadataResult = await loadMetadata();
    if (!metadataResult.ok) return metadataResult;
    
    const metadata = metadataResult.value;
    const contentHash = calculateHash(content);

    // 重複チェック
    for (const existingUpload of Object.values(metadata.uploads)) {
      if (existingUpload.contentHash === contentHash) {
        return err({ 
          kind: 'DuplicateError', 
          message: `Content already uploaded as ${existingUpload.filename}` 
        });
      }
    }

    // 新しいアップロード
    const id = randomUUID();
    const uploadMeta: CsvUploadMeta = {
      id,
      filename,
      size: Buffer.byteLength(content, 'utf8'),
      contentHash,
      uploadedAt: new Date(),
      uploadedBy,
    };

    try {
      // ファイル保存
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(getFilePath(id), content, 'utf8');

      // メタデータ更新
      metadata.uploads[id] = uploadMeta;
      const saveResult = await saveMetadata(metadata);
      if (!saveResult.ok) return saveResult;

      return ok(uploadMeta);
    } catch (e) {
      return err({ 
        kind: 'StorageError', 
        message: `Failed to save file: ${(e as Error).message}` 
      });
    }
  };

  const list = async (): Promise<Result<ReadonlyArray<CsvUploadMeta>, CsvUploadError>> => {
    const metadataResult = await loadMetadata();
    if (!metadataResult.ok) return metadataResult;

    const uploads = Object.values(metadataResult.value.uploads);
    // アップロード日時の降順でソート
    uploads.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    
    return ok(uploads);
  };

  const get = async (id: string): Promise<Result<CsvUploadMeta | null, CsvUploadError>> => {
    const metadataResult = await loadMetadata();
    if (!metadataResult.ok) return metadataResult;

    const upload = metadataResult.value.uploads[id] || null;
    return ok(upload);
  };

  const getContent = async (id: string): Promise<Result<string | null, CsvUploadError>> => {
    const metadataResult = await loadMetadata();
    if (!metadataResult.ok) return metadataResult;

    if (!metadataResult.value.uploads[id]) {
      return ok(null);
    }

    try {
      const content = await fs.readFile(getFilePath(id), 'utf8');
      return ok(content);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        return ok(null);
      }
      return err({ 
        kind: 'StorageError', 
        message: `Failed to read file: ${(e as Error).message}` 
      });
    }
  };

  const deleteUpload = async (id: string): Promise<Result<boolean, CsvUploadError>> => {
    const metadataResult = await loadMetadata();
    if (!metadataResult.ok) return metadataResult;

    const metadata = metadataResult.value;
    
    if (!metadata.uploads[id]) {
      return ok(false);
    }

    try {
      // ファイル削除
      await fs.unlink(getFilePath(id));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
        return err({ 
          kind: 'StorageError', 
          message: `Failed to delete file: ${(e as Error).message}` 
        });
      }
    }

    // メタデータから削除
    delete metadata.uploads[id];
    const saveResult = await saveMetadata(metadata);
    if (!saveResult.ok) return saveResult;

    return ok(true);
  };

  return {
    upload,
    list,
    get,
    getContent,
    delete: deleteUpload,
  };
};