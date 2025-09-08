const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Listen for stats updates from main process
  onStats: (callback) => {
    ipcRenderer.on('stats-update', (event, stats) => callback(stats));
  },
  
  // Remove all listeners for stats updates
  removeAllStatsListeners: () => {
    ipcRenderer.removeAllListeners('stats-update');
  },
  
  // Request initial stats
  requestInitialStats: () => {
    return ipcRenderer.invoke('get-initial-stats');
  },
  
  // Get app version and info
  getAppInfo: () => {
    return {
      version: process.env.npm_package_version || '1.0.0',
      platform: process.platform,
      arch: process.arch
    };
  }
});
