import { statSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { createHash } from "node:crypto";
import type { Result } from "../utils/result.js";
import { ok, err } from "../utils/result.js";

export type CsvUploadRecord = {
  id: string; // filename
  filename: string;
  size: number;
  contentHash: string;
  uploadedAt: Date;
};

export type CsvRegistry = {
  list(): Result<ReadonlyArray<CsvUploadRecord>, CsvRegistryError>;
  latest(): Result<CsvUploadRecord | undefined, CsvRegistryError>;
  loadContent(id: string): Result<string, CsvRegistryError>;
};

const sha256 = (buf: Buffer): string => createHash("sha256").update(buf).digest("hex");

export type CsvRegistryError = {
  kind: "FsError";
  op: "readdir" | "stat" | "read";
  message: string;
  file?: string;
};

export const fileSystemCsvRegistry = (dir = resolve("data")): CsvRegistry => {
  const list = (): Result<ReadonlyArray<CsvUploadRecord>, CsvRegistryError> => {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      const recs: CsvUploadRecord[] = [];
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (extname(entry.name).toLowerCase() !== ".csv") continue;
        try {
          const full = join(dir, entry.name);
          const st = statSync(full);
          const buf = readFileSync(full);
          recs.push({
            id: entry.name,
            filename: entry.name,
            size: st.size,
            contentHash: sha256(buf),
            uploadedAt: st.mtime,
          });
        } catch (errAny) {
          const msg = errAny instanceof Error ? errAny.message : String(errAny);
          return err({ kind: "FsError", op: "stat", message: msg, file: entry.name });
        }
      }
      recs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
      return ok(recs);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return err({ kind: "FsError", op: "readdir", message: msg });
    }
  };

  const latest = (): Result<CsvUploadRecord | undefined, CsvRegistryError> => {
    const res = list();
    return res.ok ? ok(res.value[0]) : res;
  };

  const loadContent = (id: string): Result<string, CsvRegistryError> => {
    try {
      const full = resolve(dir, id);
      const text = readFileSync(full, "utf8");
      return ok(text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return err({ kind: "FsError", op: "read", message: msg, file: id });
    }
  };

  return { list, latest, loadContent };
};
