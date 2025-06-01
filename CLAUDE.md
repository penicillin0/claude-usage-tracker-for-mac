# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

macOS menu bar application that visualizes Claude Code usage costs using the `ccusage` npm library to read local usage history files.

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

**Main Process** (`src/main.ts`):
- System tray lifecycle management
- IPC communication setup (handles `get-usage-data`)
- Executes ccusage via child_process
- Data aggregation: fetches today's usage and calculates all-time totals

**Renderer Process** (`src/index.html`):
- Single HTML file with embedded styles and scripts
- Receives data via IPC (`usage-data` event)
- Displays daily and total usage with currency formatting
- No UI framework - vanilla JavaScript

**Data Flow**:
1. Main process executes `npx ccusage daily --json` commands
2. Aggregates data (today's usage + all-time totals)
3. Sends processed data to renderer via IPC
4. Renderer formats and displays in UI

## ccusage Integration Details

The app uses ccusage v0.2.2 which only supports `daily` and `session` commands (no `total` command). Implementation:

```typescript
// Get today's usage
const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
await execAsync(`npx ccusage daily --since ${today} --json`);

// Calculate totals from all daily data
const allTimeResult = await execAsync("npx ccusage daily --json");
// Manually sum inputTokens, outputTokens, and cost
```

## Known Issues

- **Icon Loading**: macOS requires Template images for menu bar. Uses `iconTemplate.png` on Darwin
- **Security**: Using `nodeIntegration: true` and `contextIsolation: false` (temporary solution)
- **Error Handling**: ccusage commands may fail if no usage data exists

## File Structure

```
src/
├── main.ts        # Electron main process
└── index.html     # Renderer with embedded CSS/JS
assets/
├── icon.png       # Standard tray icon
└── iconTemplate.png # macOS menu bar icon
dist/              # TypeScript output (git-ignored)
```
