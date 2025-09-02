import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fileSystemCsvRegistry } from '../src/services/csv-registry.js'
import { createDefaultDataIntegrationService } from '../src/services/data-integration.js'
import { createFileSystemUploadService } from '../src/services/csv-upload.js'
import { sumUsageByUser, usersExceedingMonthlyQuota } from '../src/services/metrics.js'
import { parseUsageCsv } from '../src/parsers/usage-csv.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function main() {
  // CSV service: uploads > data の順で参照
  const csvRegistry = fileSystemCsvRegistry('data')
  const csvUploadService = createFileSystemUploadService('uploads')

  const csvService = {
    async getLatest() {
      const uploaded = await csvUploadService.list()
      if (uploaded.ok && uploaded.value.length > 0) {
        const latest = uploaded.value[0]
        // Validate header quickly; if invalid, fall back to data dir
        const uploadedContent = await csvUploadService.getContent(latest.id)
        if (uploadedContent.ok && uploadedContent.value) {
          const parsed = parseUsageCsv(uploadedContent.value)
          if (parsed.ok) {
            return { ok: true, value: {
              id: latest.id,
              filename: latest.filename,
              size: latest.size,
              contentHash: latest.contentHash,
              uploadedAt: latest.uploadedAt,
            }} as const
          }
          console.warn('Uploaded CSV ignored due to parse error:', parsed.error.message)
        }
      }
      const res = csvRegistry.latest()
      return res.ok
        ? { ok: true, value: res.value || null } as const
        : { ok: false, error: { kind: res.error.kind, message: res.error.message } } as const
    },
    async getContent(id: string) {
      const uploadedContent = await csvUploadService.getContent(id)
      if (uploadedContent.ok && uploadedContent.value) {
        return { ok: true, value: uploadedContent.value } as const
      }
      const res = csvRegistry.loadContent(id)
      return res.ok
        ? { ok: true, value: res.value } as const
        : { ok: false, error: { kind: res.error.kind, message: res.error.message } } as const
    }
  }

  const integration = createDefaultDataIntegrationService(csvService)
  const result = await integration.getIntegratedData()
  if (!result.ok) {
    throw new Error(`Integration failed: ${result.error.kind}: ${result.error.message}`)
  }

  // 追加統計（フロント利便性向上）
  const data = result.value
  let enhancedCsv = data.csvData
  if (enhancedCsv) {
    const totals = sumUsageByUser(enhancedCsv.records)
    const exceeding = usersExceedingMonthlyQuota(enhancedCsv.records)
    enhancedCsv = {
      ...enhancedCsv,
      totalUsers: totals.size,
      exceedingUsers: exceeding.size,
    } as any
  }

  const integrated = {
    ...data,
    csvData: enhancedCsv,
    dataSourceStatus: {
      ...data.dataSourceStatus,
      apiLastFetched: data.dataSourceStatus.seatsLastUpdated,
    } as any,
  }

  const outPath = resolve(__dirname, '../apps/web/public/data.json')
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(integrated, null, 2), 'utf8')
  console.log(`Wrote ${outPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
