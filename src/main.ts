import { BrowserWindow, Menu, Tray, app, ipcMain } from "electron";
import { exec } from "node:child_process";
import * as path from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;

async function fetchUsageData() {
  try {
    // Get today's date in YYYYMMDD format
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    // Get today's usage
    const todayResult = await execAsync(
      `npx ccusage daily --since ${today} --json`,
    );

    const todayData = JSON.parse(todayResult.stdout);

    // Get all-time usage
    const allTimeResult = await execAsync("npx ccusage daily --json");
    const allTimeData = JSON.parse(allTimeResult.stdout);

    // Calculate totals from all-time data
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;

    if (allTimeData?.totals) {
      totalInputTokens = allTimeData.totals.inputTokens || 0;
      totalOutputTokens = allTimeData.totals.outputTokens || 0;
      totalCost = allTimeData.totals.totalCost || 0;
    }

    // Get today's totals
    let todayInputTokens = 0;
    let todayOutputTokens = 0;
    let todayCost = 0;

    if (todayData?.daily && Array.isArray(todayData.daily) && todayData.daily.length > 0) {
      todayInputTokens = todayData.daily[0].inputTokens || 0;
      todayOutputTokens = todayData.daily[0].outputTokens || 0;
      todayCost = todayData.daily[0].totalCost || 0;
    }

    return {
      daily: {
        inputTokens: todayInputTokens,
        outputTokens: todayOutputTokens,
        cost: todayCost,
      },
      total: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
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

async function updateUsageData() {
  const usageData = await fetchUsageData();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("usage-data", usageData);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "../src/index.html"));

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.on("did-finish-load", () => {
    updateUsageData();
  });
}

function createTray() {
  // Use Template icon for macOS menu bar
  const iconName =
    process.platform === "darwin" ? "iconTemplate.png" : "icon.png";
  const iconPath = path.join(__dirname, "..", "assets", iconName);

  try {
    tray = new Tray(iconPath);
    // On macOS, make the icon properly sized for menu bar
    if (process.platform === "darwin") {
      tray.setTitle(""); // Clear any title
    }
  } catch (error) {
    console.error("Failed to create tray:", error);
    return;
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Usage",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      },
    },
    {
      label: "Refresh",
      click: () => {
        updateUsageData();
      },
    },
    {
      type: "separator",
    },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Claude Usage Tracker");
  tray.setContextMenu(contextMenu);
}

ipcMain.handle("get-usage-data", async () => {
  return await fetchUsageData();
});

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
