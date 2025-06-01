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

The application follows Electron's single-process architecture with a tray-only design:

**Main Process** (`src/main.ts`):
- System tray lifecycle management
- Executes ccusage via child_process
- Data aggregation: fetches today's usage and calculates all-time totals
- Menu construction and updates

**Key Functions**:
- `fetchUsageData()`: Executes ccusage commands and parses JSON responses
- `createTray()`: Initializes tray icon (uses template icon on macOS)
- `updateMenu()`: Builds context menu with formatted usage data

**Data Flow**:
1. Execute `npx ccusage daily --since [today] --json` for today's usage
2. Execute `npx ccusage daily --json` for all-time data
3. Parse and aggregate token counts and costs
4. Display formatted data in tray menu

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
- **Error Handling**: ccusage commands may fail if no usage data exists

## File Structure

```
src/
└── main.ts        # Electron main process
assets/
├── icon.png       # Standard tray icon
└── iconTemplate.png # macOS menu bar icon
dist/              # TypeScript output (git-ignored)
```
