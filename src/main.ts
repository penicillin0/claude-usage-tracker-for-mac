import { Menu, type MenuItemConstructorOptions, Tray, app } from "electron";
import { exec } from "node:child_process";
import * as path from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

let tray: Tray | null = null;
let refreshInterval: NodeJS.Timeout | null = null;
let isMenuOpen = false;

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
    let totalTotalTokens = 0;
    let totalCost = 0;

    if (allTimeData?.totals) {
      totalTotalTokens = allTimeData.totals.totalTokens || 0;
      totalCost = allTimeData.totals.totalCost || 0;
    }

    // Get today's totals
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

  // Track menu visibility for Windows/Linux (left-click behavior)
  if (process.platform !== "darwin") {
    tray.on("click", () => {
      isMenuOpen = !isMenuOpen;
      if (isMenuOpen) {
        startAutoRefresh();
        tray?.popUpContextMenu();
      } else {
        stopAutoRefresh();
      }
    });
  }

  // macOS uses native menu behavior
  // Menu events will be set up after menu is created in updateMenu()

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
        label: `  Tokens: ${usageData.daily.totalTokens.toLocaleString()}`,
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
        label: `  Tokens: ${usageData.total.totalTokens.toLocaleString()}`,
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
    label: "Quit",
    click: () => {
      app.quit();
    },
  });

  const contextMenu = Menu.buildFromTemplate(menuItems);
  tray?.setContextMenu(contextMenu);

  // Set up menu event listeners for macOS
  if (process.platform === "darwin" && tray) {
    contextMenu.on("menu-will-show", () => {
      isMenuOpen = true;
      startAutoRefresh();
    });
    contextMenu.on("menu-will-close", () => {
      isMenuOpen = false;
      stopAutoRefresh();
    });
  }
}

function startAutoRefresh() {
  // Stop any existing interval
  stopAutoRefresh();

  // Update immediately
  updateMenu();

  // Then update every 3 seconds
  refreshInterval = setInterval(() => {
    console.log("Refreshing usage data...");

    updateMenu();
  }, 3000);
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

app.whenReady().then(async () => {
  await createTray();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopAutoRefresh();
});
