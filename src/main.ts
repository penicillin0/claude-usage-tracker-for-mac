import { app } from "electron";
import { TrayManager } from "./tray";

const trayManager = new TrayManager();

app.whenReady().then(async () => {
  // Hide the dock icon on macOS
  if (process.platform === "darwin" && app.dock) {
    app.dock.hide();
  }

  await trayManager.initializeTray();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
