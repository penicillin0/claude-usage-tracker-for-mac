# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a macOS menu bar application that visualizes Claude Code usage costs. It's built with TypeScript and Electron, utilizing the `ccusage` npm library to read local Claude Code usage history files and calculate costs.

## Commands

```bash
# Development
npm run dev          # Compile TypeScript and start Electron
npm run build        # Compile TypeScript only
npm start            # Run Electron (requires prior build)

# Code Quality
npm run lint         # Run Biome linter
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format code with Biome
npm run check        # Run all Biome checks
npm run check:fix    # Auto-fix all Biome issues
```

## Architecture

The application follows Electron's multi-process architecture:

- **Main Process** (`src/main.ts`): 
  - Creates system tray icon and context menu
  - Manages BrowserWindow lifecycle
  - Handles IPC communication with renderer
  - Executes ccusage commands via child_process

- **Renderer Process** (`src/index.html`):
  - Displays usage statistics in a minimal UI
  - Receives data from main process via IPC
  - Uses vanilla HTML/CSS/JavaScript (no framework)

- **Build Output**: TypeScript compiles to `dist/` directory

## ccusage Integration

The app needs to integrate with the `ccusage` CLI tool to fetch usage data. Implementation approach:

```typescript
// In main process, use child_process to execute ccusage
import { exec } from 'child_process';

// Fetch daily usage
exec('npx ccusage daily --json', (error, stdout) => {
  if (!error) {
    const data = JSON.parse(stdout);
    // Send to renderer via IPC
    mainWindow?.webContents.send('usage-data', data);
  }
});

// Fetch total usage
exec('npx ccusage total --json', (error, stdout) => {
  // Process total usage data
});
```

## Current Implementation Status

- ✅ Basic Electron setup with TypeScript
- ✅ System tray integration with context menu
- ✅ Window creation and management
- ❌ ccusage data fetching not implemented
- ❌ IPC communication between processes not set up
- ❌ UI only shows placeholder text
- ❌ Missing tray icon asset (`assets/icon.png`)

## Important Notes

- **Electron Security**: Currently using `nodeIntegration: true` and `contextIsolation: false` for simplicity. Consider enabling context isolation and using preload scripts for production.
- **Icon Path**: References `../assets/icon.png` which doesn't exist yet
- **Window Management**: Window is created hidden and only shown via tray menu
- **TypeScript Config**: Targets CommonJS modules and ES2016
