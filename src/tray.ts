import { Menu, type MenuItemConstructorOptions, Tray, app } from "electron";
import * as path from "node:path";
import type { UsageData } from "./types";
import { getUserUsage } from "./usage";

export class TrayManager {
  private tray: Tray | null = null;

  async initializeTray(): Promise<void> {
    const iconName =
      process.platform === "darwin" ? "iconTemplate.png" : "icon.png";
    const iconPath = path.join(__dirname, "..", "assets", iconName);

    try {
      this.tray = new Tray(iconPath);
      if (process.platform === "darwin") {
        this.tray.setTitle("");
      }
    } catch (error) {
      console.error("Failed to create tray:", error);
      return;
    }

    this.tray.setToolTip("Claude Usage Tracker");

    if (process.platform !== "darwin") {
      this.tray.on("click", () => {
        this.refreshTrayMenu();
        this.tray?.popUpContextMenu();
      });
    }

    await this.refreshTrayMenu();
  }

  async refreshTrayMenu(): Promise<void> {
    const usageData = await getUserUsage();
    const menuItems = this.buildMenuItems(usageData);
    const contextMenu = Menu.buildFromTemplate(menuItems);

    this.tray?.setContextMenu(contextMenu);

    if (process.platform === "darwin" && this.tray) {
      contextMenu.on("menu-will-show", () => {
        this.refreshTrayMenu();
      });
    }
  }

  private buildMenuItems(usageData: UsageData): MenuItemConstructorOptions[] {
    const menuItems: MenuItemConstructorOptions[] = [];

    if (usageData.error) {
      menuItems.push({
        label: "Error loading usage data",
        enabled: false,
      });
    } else {
      this.addDailyUsageItems(menuItems, usageData);
      menuItems.push({ type: "separator" });
      this.addTotalUsageItems(menuItems, usageData);
    }

    menuItems.push({ type: "separator" });
    menuItems.push({
      label: "Quit",
      click: () => {
        app.quit();
      },
    });

    return menuItems;
  }

  private addDailyUsageItems(
    menuItems: MenuItemConstructorOptions[],
    usageData: UsageData,
  ): void {
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
  }

  private addTotalUsageItems(
    menuItems: MenuItemConstructorOptions[],
    usageData: UsageData,
  ): void {
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
}
