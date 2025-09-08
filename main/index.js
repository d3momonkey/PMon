const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
const path = require('path');
const isDev = process.argv.includes('--dev');

// Enable hot reload for development
if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

class PMon {
  constructor() {
    this.mainWindow = null;
    this.tray = null;
    this.monitoringService = null;
  }

  async initialize() {
    await app.whenReady();
    this.createMainWindow();
    this.setupTray();
    this.setupMenu();
    this.startMonitoring();
    
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      titleBarStyle: 'hiddenInset',
      backgroundColor: '#1a1a1a',
      webPreferences: {
        contextIsolation: true,
        enableRemoteModule: false,
        nodeIntegration: false,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: path.join(__dirname, '..', 'assets', 'icon.png'),
      show: false
    });

    this.mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
    
    // Show window when ready to prevent visual flash
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
    });

    if (isDev) {
      this.mainWindow.webContents.openDevTools();
      console.log('Development mode - DevTools opened automatically');
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  setupTray() {
    // Tray icon placeholder - will create icon later
    const trayIconPath = path.join(__dirname, '..', 'assets', 'tray-icon.png');
    try {
      this.tray = new Tray(trayIconPath);
      this.tray.setToolTip('PMon - Performance Monitor');
      
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Show PMon',
          click: () => {
            if (this.mainWindow) {
              this.mainWindow.show();
              this.mainWindow.focus();
            } else {
              this.createMainWindow();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          click: () => {
            app.quit();
          }
        }
      ]);
      
      this.tray.setContextMenu(contextMenu);
    } catch (error) {
      console.warn('Tray icon not found, skipping tray setup');
    }
  }

  setupMenu() {
    const template = [
      {
        label: 'PMon',
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  async startMonitoring() {
    // Import monitoring service
    const MonitoringService = require('../modules/monitoring-service');
    this.monitoringService = new MonitoringService();
    
    // Start monitoring and send updates to renderer
    this.monitoringService.on('stats-update', (stats) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('stats-update', stats);
      }
    });

    await this.monitoringService.start();
  }
}

// IPC handlers
ipcMain.handle('get-initial-stats', async () => {
  // Return initial stats if monitoring service is available
  return {};
});

// Application entry point
const pmon = new PMon();
pmon.initialize().catch(console.error);

// Handle app events
app.on('before-quit', () => {
  if (pmon.monitoringService) {
    pmon.monitoringService.stop();
  }
});
