import type { UsageData } from "./types";

export async function getUserUsage(): Promise<UsageData> {
  try {
    // Dynamic import for ESM module
    // @ts-ignore - dynamic import of ESM module
    const { loadUsageData } = await import("ccusage/data-loader");
    const { calculateTotals, createTotalsObject } = await import(
      // @ts-ignore - dynamic import of ESM module
      "ccusage/calculate-cost"
    );

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    // Get today's usage data
    const todayData = await loadUsageData({
      since: today,
    });

    // Get all-time usage data
    const allTimeData = await loadUsageData();

    // Calculate totals for all-time data
    const allTimeTotals = calculateTotals(allTimeData);
    const allTimeTotalsObject = createTotalsObject(allTimeTotals);

    // Calculate today's totals
    let todayTotalTokens = 0;
    let todayCost = 0;

    if (todayData.length > 0) {
      const todayTotals = calculateTotals(todayData);
      const todayTotalsObject = createTotalsObject(todayTotals);
      todayTotalTokens = todayTotalsObject.totalTokens;
      todayCost = todayTotalsObject.totalCost;
    }

    return {
      daily: {
        totalTokens: todayTotalTokens,
        cost: todayCost,
      },
      total: {
        totalTokens: allTimeTotalsObject.totalTokens,
        cost: allTimeTotalsObject.totalCost,
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
