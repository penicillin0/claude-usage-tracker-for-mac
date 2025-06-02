import { app } from "electron";
import { exec } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { CcusageResponse, UsageData } from "./types";

const execAsync = promisify(exec);

/**
 * Detects if ccusage is available and returns the command to use
 */
async function detectCcusageCommand(): Promise<string | null> {
  const possibleCommands = [];

  if (app.isPackaged) {
    // In packaged app, try these locations in order
    possibleCommands.push(
      // 1. Unpacked ccusage from asar
      path.join(
        process.resourcesPath,
        "app.asar.unpacked",
        "node_modules",
        ".bin",
        "ccusage",
      ),
      // 2. Extra resources
      path.join(process.resourcesPath, "ccusage", "bin", "ccusage.js"),
      // 3. Regular node_modules (if not in asar)
      path.join(
        process.resourcesPath,
        "app",
        "node_modules",
        ".bin",
        "ccusage",
      ),
    );
  }

  // Always try system-wide installations
  possibleCommands.push(
    "ccusage", // In PATH
    "/usr/local/bin/ccusage",
    "/usr/bin/ccusage",
    "/opt/homebrew/bin/ccusage",
    path.join(process.env.HOME || "", ".npm-global/bin/ccusage"),
  );

  // Test each command
  for (const cmd of possibleCommands) {
    try {
      // Check if file exists (for absolute paths)
      if (path.isAbsolute(cmd)) {
        await fs.access(cmd, fs.constants.X_OK);
        return cmd;
        // biome-ignore lint/style/noUselessElse: <explanation>
      } else {
        // Check if command is available in PATH
        await execAsync(`which ${cmd}`);
        return cmd;
      }
    } catch {
      // Try next command
      // biome-ignore lint/correctness/noUnnecessaryContinue: <explanation>
      continue;
    }
  }

  // If no direct ccusage found, try npx
  try {
    await execAsync("which npx");
    return "npx ccusage";
  } catch {
    return null;
  }
}

/**
 * Alternative: Read usage data directly from files (no ccusage needed)
 */
async function readUsageDirectly(): Promise<UsageData> {
  try {
    const homeDir = app.getPath("home");
    const usageDir = path.join(homeDir, ".claude", "usage");

    // Get today's date in YYYYMMDD format
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    let todayTokens = 0;
    let todayCost = 0;
    let totalTokens = 0;
    let totalCost = 0;

    // Read all usage files
    const files = await fs.readdir(usageDir);
    const usageFiles = files.filter((f) => f.endsWith(".json"));

    for (const file of usageFiles) {
      const filePath = path.join(usageDir, file);
      const content = await fs.readFile(filePath, "utf-8");
      const data = JSON.parse(content);

      // Aggregate data
      for (const session of data.sessions || []) {
        const tokens = (session.inputTokens || 0) + (session.outputTokens || 0);
        const cost = session.cost || 0;

        totalTokens += tokens;
        totalCost += cost;

        // Check if this session is from today
        const sessionDate = new Date(session.timestamp)
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "");
        if (sessionDate === today) {
          todayTokens += tokens;
          todayCost += cost;
        }
      }
    }

    return {
      daily: {
        totalTokens: todayTokens,
        cost: todayCost,
      },
      total: {
        totalTokens: totalTokens,
        cost: totalCost,
      },
    };
  } catch (error) {
    console.error("Error reading usage files directly:", error);
    throw error;
  }
}

/**
 * Execute ccusage with proper error handling and fallbacks
 */
async function executeCcusageCommand(args: string): Promise<string> {
  const ccusageCmd = await detectCcusageCommand();

  if (!ccusageCmd) {
    throw new Error(
      "ccusage not found. Please ensure Node.js is installed or try reinstalling the app.",
    );
  }

  const env = {
    ...process.env,
    PATH: `/usr/local/bin:/usr/bin:/opt/homebrew/bin:${process.env.PATH}`,
    HOME: process.env.HOME || app.getPath("home"),
  };

  try {
    const command = `${ccusageCmd} ${args}`;
    console.log(`Executing: ${command}`);

    const result = await execAsync(command, {
      env,
      timeout: 30000, // 30 second timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    return result.stdout;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  } catch (error: any) {
    // Log the full error for debugging
    console.error("ccusage execution failed:", error);

    // Enhance error message
    if (error.code === "ENOENT") {
      throw new Error("ccusage executable not found");
      // biome-ignore lint/style/noUselessElse: <explanation>
    } else if (error.signal === "SIGTERM") {
      throw new Error("ccusage command timed out");
      // biome-ignore lint/style/noUselessElse: <explanation>
    } else if (error.stderr?.includes("No usage data found")) {
      // This is actually okay - no data yet
      return JSON.stringify({
        daily: [],
        totals: { totalTokens: 0, totalCost: 0 },
      });
    }

    throw error;
  }
}

export async function getUserUsage(): Promise<UsageData> {
  try {
    // Try ccusage first
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    const todayResult = await executeCcusageCommand(
      `daily --since ${today} --json`,
    );
    const todayData: CcusageResponse = JSON.parse(todayResult);

    const allTimeResult = await executeCcusageCommand("daily --json");
    const allTimeData: CcusageResponse = JSON.parse(allTimeResult);

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
    console.error("Error with ccusage, trying direct file read:", error);

    // Fallback: try reading files directly
    try {
      return await readUsageDirectly();
    } catch (fallbackError) {
      console.error("Direct file read also failed:", fallbackError);

      // Return empty data with error
      return {
        daily: null,
        total: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/**
 * Check if usage tracking is available at all
 */
export async function isUsageAvailable(): Promise<{
  available: boolean;
  method: "ccusage" | "direct" | "none";
  error?: string;
}> {
  // Check for ccusage
  const ccusageCmd = await detectCcusageCommand();
  if (ccusageCmd) {
    return { available: true, method: "ccusage" };
  }

  // Check for direct file access
  try {
    const usageDir = path.join(app.getPath("home"), ".claude", "usage");
    await fs.access(usageDir, fs.constants.R_OK);
    return { available: true, method: "direct" };
  } catch {
    return {
      available: false,
      method: "none",
      error:
        "No Claude usage data found. Please use Claude Code to generate some usage data first.",
    };
  }
}
