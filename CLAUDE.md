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

# Distribution
npm run dist         # Build and package for current platform
npm run dist:mac     # Build DMG and ZIP for macOS (both architectures)
npm run dist:mac:universal  # Build universal macOS app
```

## Architecture

The application follows Electron's single-process architecture with a tray-only design:

**Main Process** (`src/main.ts`):
- Application entry point and lifecycle management
- Initializes TrayManager when app is ready

**TrayManager** (`src/tray.ts`):
- System tray lifecycle management
- Menu construction and updates
- Handles platform-specific tray behavior (macOS vs others)

**Usage Module** (`src/usage.ts`):
- Data fetching via dynamic imports from ccusage library
- Aggregates today's usage and calculates all-time totals
- Error handling for missing usage data

**Key Functions**:
- `getUserUsage()`: Uses ccusage data-loader and calculate-cost modules
- `TrayManager.initializeTray()`: Creates tray icon and sets up event handlers
- `TrayManager.refreshTrayMenu()`: Builds context menu with formatted usage data

**Data Flow**:
1. Dynamic import ccusage/data-loader and ccusage/calculate-cost modules
2. Load today's usage data with since parameter
3. Load all-time usage data
4. Calculate totals and format for display in tray menu

## ccusage Integration Details

The app uses ccusage v0.3.0 and leverages its ESM modules directly via dynamic imports. Implementation:

```typescript
// Dynamic imports for ESM modules
const { loadUsageData } = await import("ccusage/data-loader");
const { calculateTotals, createTotalsObject } = await import("ccusage/calculate-cost");

// Get today's usage
const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const todayData = await loadUsageData({ since: today });

// Get all-time usage and calculate totals
const allTimeData = await loadUsageData();
const allTimeTotals = calculateTotals(allTimeData);
```

## Known Issues

- **Error Handling**: Dynamic imports may fail if ccusage modules are unavailable
- **TypeScript**: Uses @ts-ignore for dynamic ESM imports due to CommonJS/ESM interop

## File Structure

```
src/
├── main.ts        # Application entry point
├── tray.ts        # Tray management and menu creation
├── usage.ts       # Usage data fetching via ccusage
└── types.ts       # TypeScript type definitions
assets/
└── icon.png       # Tray icon
dist/              # TypeScript output (git-ignored)
release/           # electron-builder output (git-ignored)
```
