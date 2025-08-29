import { fileSystemCsvRegistry } from "./services/csv-registry.js";
import { parseUsageCsv } from "./parsers/usage-csv.js";
import { isOk } from "./utils/result.js";
import { sumUsageByUser, usersExceedingMonthlyQuota } from "./services/metrics.js";
import { loadDemoSeats } from "./api/seats.js";
import { estimateMonthlyCost, monthRangeUtc } from "./services/billing.js";

const main = () => {
  const csvReg = fileSystemCsvRegistry("data");
  const latestRes = csvReg.latest();
  if (isOk(latestRes)) {
    const latest = latestRes.value;
    if (!latest) {
      console.error("No CSV found in data/. Place a CSV to proceed.");
    } else {
      const csvRes = csvReg.loadContent(latest.id);
      if (!isOk(csvRes)) {
        console.error("CSV read error:", csvRes.error);
      } else {
        const parsed = parseUsageCsv(csvRes.value);
        if (isOk(parsed)) {
          const totals = sumUsageByUser(parsed.value);
          const exceeding = usersExceedingMonthlyQuota(parsed.value);
          console.log("CSV summary:");
          console.log(`- Records: ${parsed.value.length}`);
          console.log(`- Users: ${totals.size}`);
          console.log(`- Exceeding users: ${exceeding.size}`);
        } else {
          console.error("CSV parse error:", parsed.error);
        }
      }
    }
  } else {
    console.error("CSV registry error:", latestRes.error);
  }

  const seatsRes = loadDemoSeats();
  if (isOk(seatsRes)) {
    const now = new Date();
    const range = monthRangeUtc(now.getUTCFullYear(), now.getUTCMonth() + 1);
    const estimate = estimateMonthlyCost(seatsRes.value, range);
    console.log("Billing estimate (current month, simplified):");
    console.log(`- Active users: ${estimate.activeUserCount}`);
    console.log(`- Unit price: $${estimate.unitPrice.toFixed(2)}`);
    console.log(`- Estimated cost: $${estimate.estimatedCost.toFixed(2)}`);
  } else {
    console.error("Seats load error:", seatsRes.error);
  }
};

main();
