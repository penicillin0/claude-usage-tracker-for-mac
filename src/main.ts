import { app, BrowserWindow, Menu, Tray } from "electron";
import * as path from "path";

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;

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
}

function createTray() {
  tray = new Tray(path.join(__dirname, "../assets/icon.png"));

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
