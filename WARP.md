# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Development Commands

### Running the Application
```bash
npm start           # Start in production mode
npm run dev         # Start in development mode with hot reload and dev tools
```

### Building for Distribution
```bash
npm run build       # Build using electron-builder (default)
npm run dist        # Build without publishing
```

Platform-specific builds are available but use `npm run build` for the current platform.

### Development Tools
- ESLint is configured with specific rules for main/renderer processes
- Use `F12` or View menu to access DevTools in development mode
- Development mode includes electron-reload for hot reloading

## Architecture Overview

PMon is an Electron application with a **three-process architecture**:

### Main Process (`main/index.js`)
- **PMon class**: Handles application lifecycle, window management, system tray
- **Security-first**: Context isolation enabled, node integration disabled in renderer
- **IPC coordination**: Routes system monitoring data from modules to renderer
- **Menu system**: Native menus with development tools access

### Monitoring Service (`modules/monitoring-service.js`) 
- **Central coordinator**: EventEmitter that orchestrates all system monitoring modules
- **Smart scheduling**: Light metrics (CPU/Memory/Network) update every 1s, heavy metrics (GPU/Storage/NPU) every 3s, motherboard info every 30s
- **Module pattern**: Individual modules for cpu.js, memory.js, gpu.js, npu.js, storage.js, network.js, motherboard.js
- **Cross-platform**: Uses `systeminformation` library for unified system data access

### Renderer Process (`renderer/`)
- **Vanilla JavaScript**: No frameworks, uses modern ES6+ classes and features
- **Chart.js integration**: Real-time animated charts with theme-aware styling  
- **Event delegation**: Complex card navigation system with fallback listeners
- **CSS theming**: Custom properties for instant dark/light theme switching

## Critical Implementation Details

### Card Navigation System
**Known Issue Fixed**: Card clicking navigation was broken due to class detection logic.
- **Problem**: `Array.find(cls => cls.endsWith('-card'))` found "metric-card" instead of specific types
- **Solution**: Filter logic: `cls.endsWith('-card') && cls !== 'metric-card'`
- **Implementation**: Uses event delegation on `.overview-grid` with backup direct listeners

### IPC Communication Pattern
```javascript
// Main Process: monitoring-service.js emits events
this.monitoringService.on('stats-update', (stats) => {
  this.mainWindow.webContents.send('stats-update', stats);
});

// Renderer Process: main.js listens via preload bridge
window.electronAPI.onStatsUpdate((stats) => {
  this.updateUI(stats);
});
```

### Theme System Architecture
- **CSS Custom Properties**: Defined in `renderer/styles/main.css`
- **Persistence**: Theme choice saved to localStorage
- **Chart Integration**: Charts automatically update colors on theme change
- **Toggle Implementation**: Single button switches between 🌙/☀️ with instant UI updates

## File Structure Significance

```
PMon/
├── main/
│   ├── index.js           # Application entry, PMon class, window lifecycle
│   └── preload.js         # Secure IPC bridge (context isolation)
├── modules/               # System monitoring modules
│   ├── monitoring-service.js # Central EventEmitter coordinator  
│   └── [cpu|memory|gpu|npu|storage|network|motherboard].js
├── renderer/
│   ├── index.html         # Main UI structure
│   ├── styles/            # CSS with custom properties for theming
│   └── scripts/
│       ├── main.js        # PMon class, navigation, event handling
│       ├── charts.js      # ChartManager class, Chart.js integration
│       └── components.js  # UI component utilities
```

## Development Patterns

### Adding New Monitoring Modules
1. Create module in `modules/` following existing pattern (export `getStats()` function)
2. Import and integrate in `monitoring-service.js`
3. Add UI section in `renderer/index.html`
4. Handle data updates in `renderer/scripts/main.js`

### Theme Development
- Modify CSS custom properties in `:root` and `[data-theme="dark"]` selectors
- Charts automatically adapt via `ChartManager.updateChartThemes()`
- Test theme persistence across application restarts

### Security Considerations
- All system data flows through secure IPC (main → preload → renderer)
- No direct node access in renderer process
- Context isolation prevents globals pollution

## Recent Critical Fixes (v1.0.1)

### Storage Data Loading Issue - RESOLVED
**Problem**: Storage tab showed "Loading storage information..." indefinitely, additional drives not displaying.
**Root Cause**: Storage data was only updated every 3 seconds and HTML structure prevented drive population.
**Solution**: 
- Modified `monitoring-service.js` to ensure immediate storage data availability (`needsInitialStorage` check)
- Fixed storage content update logic with smart detection (`needsInitialSetup` vs `needsDriveUpdate`)
- Enhanced mock data structure to include multiple drives with proper field structure
- Added safety checks for filesystem array access: `(stats.storage.filesystem || []).forEach(...)`

### UI Card Scaling Issue - RESOLVED  
**Problem**: Cards didn't scale properly across different screen sizes, text overflow, inconsistent heights.
**Solution**:
- Improved responsive breakpoints: 1600px, 1400px, 1100px, 900px, 768px, 480px
- Replaced fixed heights with flexible `aspect-ratio` and `height: 100%`
- Enhanced text handling with `-webkit-line-clamp` for multi-line support
- Added progressive font scaling for different screen sizes

## Common Debugging Scenarios

### Cards Not Navigating
- Check console for card class detection issues
- Verify event delegation setup in `setupEventListeners()`
- Ensure card classes follow `[type]-card` pattern (not just `metric-card`)

### Charts Not Updating
- Verify Chart.js CDN accessibility
- Check `ChartManager` initialization timing
- Ensure data structure matches chart expectations

### Storage Data Not Loading
- Verify `stats.storage.filesystem` array exists and has length > 0
- Check if `needsInitialStorage` logic is working in `monitoring-service.js`
- Ensure `window.utils.formatBytesPerSecond()` is accessible (not `this.chartManager.formatBytesPerSecond`)
- Look for drive HTML elements with class `.drive-item` to confirm population
- Check mock data structure matches real API data format

### Monitoring Data Issues
- Check `monitoring-service.js` for module errors
- Verify `systeminformation` library functions for cross-platform compatibility
- Monitor console for async operation failures
- Storage data loads on first run, then every 3 seconds (heavy metrics schedule)

## Development Mode Features
- `--dev` flag enables electron-reload and development tools
- DevTools automatically disabled in production builds
- Console logging available for monitoring service debugging