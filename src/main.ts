import { app } from "electron";
import { TrayManager } from "./tray";

const trayManager = new TrayManager();

app.whenReady().then(async () => {
  await trayManager.initializeTray();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
