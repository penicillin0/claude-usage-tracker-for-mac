# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a macOS menu bar application that visualizes Claude Code usage costs. It's built with TypeScript and Electron, utilizing the `ccusage` npm library to read local Claude Code usage history files and calculate costs.

## Development Setup

Since this project is in its initial stage, you'll need to initialize the Node.js/Electron project:

```bash
# Initialize npm project
npm init -y

# Install dependencies
npm install --save-dev electron typescript @types/node
npm install ccusage

# Install Biome for linting/formatting
npm install --save-dev @biomejs/biome

# Initialize TypeScript
npx tsc --init

# Initialize Biome
npx @biomejs/biome init
```

## Architecture

This will be an Electron-based menu bar application with the following structure:
- **Main Process**: Handles menu bar integration, system tray, and file system access
- **Renderer Process**: Displays usage statistics with vanilla HTML/CSS/JavaScript
- **ccusage Integration**: Use the `ccusage` library to fetch and parse Claude Code usage data

## Key Implementation Notes

1. **Menu Bar App**: Use Electron's `Tray` API for menu bar functionality
2. **Data Source**: Read local Claude Code usage history files via `ccusage`
3. **Privacy**: Only access local files, no external API calls
4. **UI Design**: Follow macOS design guidelines for native feel
5. **Minimal Approach**: Start with basic functionality, extend as needed

## Common Commands

Once the project is set up, typical commands will be:
```bash
# Run in development
npm run dev

# Build for production
npm run build

# Lint and format code
npm run lint
npm run format

# Run TypeScript type checking
npm run typecheck
```

## ccusage Library Usage

The core functionality relies on the `ccusage` npm package:
```typescript
// Example usage
import { exec } from 'child_process';

exec('npx ccusage@latest daily --json', (error, stdout) => {
  const data = JSON.parse(stdout);
  // Process daily usage data
});
```