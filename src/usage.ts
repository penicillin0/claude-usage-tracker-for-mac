import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { CcusageResponse, UsageData } from "./types";

const execAsync = promisify(exec);

export async function getUserUsage(): Promise<UsageData> {
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    const todayResult = await execAsync(
      `npx ccusage daily --since ${today} --json`,
    );

    const todayData: CcusageResponse = JSON.parse(todayResult.stdout);

    const allTimeResult = await execAsync("npx ccusage daily --json");
    const allTimeData: CcusageResponse = JSON.parse(allTimeResult.stdout);

    let totalTotalTokens = 0;
    let totalCost = 0;

    if (allTimeData?.totals) {
      totalTotalTokens = allTimeData.totals.totalTokens || 0;
      totalCost = allTimeData.totals.totalCost || 0;
    }

    let todayTotalTokens = 0;
    let todayCost = 0;

    if (
      todayData?.daily &&
      Array.isArray(todayData.daily) &&
      todayData.daily.length > 0
    ) {
      todayTotalTokens = todayData.daily[0].totalTokens || 0;
      todayCost = todayData.daily[0].totalCost || 0;
    }

    return {
      daily: {
        totalTokens: todayTotalTokens,
        cost: todayCost,
      },
      total: {
        totalTokens: totalTotalTokens,
        cost: totalCost,
      },
    };
  } catch (error) {
    console.error("Error fetching usage data:", error);
    return {
      daily: null,
      total: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
