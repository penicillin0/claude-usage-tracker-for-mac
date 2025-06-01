import { Menu, type MenuItemConstructorOptions, Tray, app } from "electron";
import { exec } from "node:child_process";
import * as path from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

let tray: Tray | null = null;

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

    if (
      todayData?.daily &&
      Array.isArray(todayData.daily) &&
      todayData.daily.length > 0
    ) {
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

async function createTray() {
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

  tray.setToolTip("Claude Usage Tracker");
  await updateMenu();
}

async function updateMenu() {
  const usageData = await fetchUsageData();

  const menuItems: MenuItemConstructorOptions[] = [];

  // Add usage information to menu
  if (usageData.error) {
    menuItems.push({
      label: "Error loading usage data",
      enabled: false,
    });
  } else {
    // Today's usage
    menuItems.push({
      label: "Today's Usage",
      enabled: false,
    });

    if (usageData.daily) {
      menuItems.push({
        label: `  Cost: $${usageData.daily.cost.toFixed(2)}`,
        enabled: false,
      });
      menuItems.push({
        label: `  Tokens: ${(usageData.daily.inputTokens + usageData.daily.outputTokens).toLocaleString()}`,
        enabled: false,
      });
    } else {
      menuItems.push({
        label: "  No usage today",
        enabled: false,
      });
    }

    menuItems.push({ type: "separator" });

    // All-time usage
    menuItems.push({
      label: "All-Time Usage",
      enabled: false,
    });

    if (usageData.total) {
      menuItems.push({
        label: `  Cost: $${usageData.total.cost.toFixed(2)}`,
        enabled: false,
      });
      menuItems.push({
        label: `  Tokens: ${(usageData.total.inputTokens + usageData.total.outputTokens).toLocaleString()}`,
        enabled: false,
      });
    } else {
      menuItems.push({
        label: "  No usage data",
        enabled: false,
      });
    }
  }

  menuItems.push({ type: "separator" });

  menuItems.push({
    label: "Refresh",
    click: async () => {
      await updateMenu();
    },
  });

  menuItems.push({ type: "separator" });

  menuItems.push({
    label: "Quit",
    click: () => {
      app.quit();
    },
  });

  const contextMenu = Menu.buildFromTemplate(menuItems);
  tray?.setContextMenu(contextMenu);
}

app.whenReady().then(async () => {
  await createTray();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
