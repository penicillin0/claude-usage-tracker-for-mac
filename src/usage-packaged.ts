import { app } from "electron";
import { exec, spawn } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import type { CcusageResponse, UsageData } from "./types";

const execAsync = promisify(exec);

/**
 * Get the correct path for npx/node executables in packaged apps
 */
function getNodePath(): string {
  // In development, use system node
  if (!app.isPackaged) {
    return "npx";
  }

  // In packaged app, we need to find the system node/npx
  // Common paths where node might be installed
  const possiblePaths = [
    "/usr/local/bin/npx",
    "/usr/bin/npx",
    "/opt/homebrew/bin/npx",
    path.join(process.env.HOME || "", ".nvm/versions/node/*/bin/npx"),
  ];

  // Try to use the PATH from the parent shell
  return "npx"; // Will be replaced with proper detection
}

/**
 * Execute ccusage with proper environment setup for packaged apps
 */
async function executeCcusage(args: string): Promise<string> {
  const npxPath = getNodePath();

  // Set up environment variables to ensure npx can find modules
  const env = {
    ...process.env,
    // Ensure PATH includes common node locations
    PATH: `/usr/local/bin:/usr/bin:/opt/homebrew/bin:${process.env.PATH}`,
    // Set HOME to ensure npx can access global packages
    HOME: process.env.HOME || app.getPath("home"),
  };

  // Option 1: Use the bundled ccusage (recommended)
  if (app.isPackaged) {
    // In packaged app, ccusage is in node_modules
    const ccusagePath = path.join(
      process.resourcesPath,
      "app",
      "node_modules",
      ".bin",
      "ccusage",
    );

    try {
      const result = await execAsync(`"${ccusagePath}" ${args}`, { env });
      return result.stdout;
    } catch (error) {
      console.error("Failed to execute bundled ccusage:", error);
      // Fall back to npx
    }
  }

  // Option 2: Use npx (requires internet and node installed)
  const command = `${npxPath} ccusage ${args}`;
  const result = await execAsync(command, {
    env,
    // Set a longer timeout for npx which might need to download
    timeout: 30000,
  });

  return result.stdout;
}

/**
 * Alternative implementation using spawn for better control
 */
async function executeCcusageSpawn(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      PATH: `/usr/local/bin:/usr/bin:/opt/homebrew/bin:${process.env.PATH}`,
      HOME: process.env.HOME || app.getPath("home"),
    };

    let command: string;
    let commandArgs: string[];

    if (app.isPackaged) {
      // Use bundled ccusage
      command = path.join(
        process.resourcesPath,
        "app",
        "node_modules",
        ".bin",
        "ccusage",
      );
      commandArgs = args;
    } else {
      // Use npx in development
      command = "npx";
      commandArgs = ["ccusage", ...args];
    }

    const child = spawn(command, commandArgs, {
      env,
      shell: true, // Use shell to handle PATH resolution
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      reject(new Error(`Failed to spawn ccusage: ${error.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`ccusage exited with code ${code}: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

export async function getUserUsage(): Promise<UsageData> {
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    // Use the new execution method
    const todayResult = await executeCcusage(`daily --since ${today} --json`);
    const todayData: CcusageResponse = JSON.parse(todayResult);

    const allTimeResult = await executeCcusage("daily --json");
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
    console.error("Error fetching usage data:", error);

    // Provide more detailed error information
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for common issues
      if (
        errorMessage.includes("command not found") ||
        errorMessage.includes("not found")
      ) {
        errorMessage =
          "Node.js or npx not found. Please ensure Node.js is installed.";
      } else if (errorMessage.includes("ENOENT")) {
        errorMessage =
          "ccusage executable not found. This may be a packaging issue.";
      } else if (
        errorMessage.includes("EACCES") ||
        errorMessage.includes("permission")
      ) {
        errorMessage =
          "Permission denied. The app may need additional permissions.";
      }
    }

    return {
      daily: null,
      total: null,
      error: errorMessage,
    };
  }
}
