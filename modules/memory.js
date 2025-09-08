const si = require('systeminformation');

class MemoryMonitor {
  constructor() {
    this.history = [];
    this.maxHistoryLength = 60; // Keep 1 minute of history
  }

  formatBytes(bytes) {
    if (bytes === 0) return { value: 0, unit: 'B' };
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = parseFloat((bytes / Math.pow(1024, i)).toFixed(2));
    
    return { value, unit: units[i] };
  }

  async getStats() {
    try {
      const [memory, memLayout] = await Promise.all([
        si.mem(),
        si.memLayout().catch(() => []) // memLayout might not be available on all systems
      ]);

      const usagePercent = Math.round((memory.used / memory.total) * 10000) / 100;
      const availablePercent = Math.round((memory.available / memory.total) * 10000) / 100;

      const stats = {
        total: memory.total,
        used: memory.used,
        free: memory.free,
        available: memory.available,
        usagePercent,
        availablePercent,
        active: memory.active,
        buffcache: memory.buffcache,
        swaptotal: memory.swaptotal,
        swapused: memory.swapused,
        swapfree: memory.swapfree,
        formatted: {
          total: this.formatBytes(memory.total),
          used: this.formatBytes(memory.used),
          free: this.formatBytes(memory.free),
          available: this.formatBytes(memory.available)
        },
        layout: memLayout.map(mem => ({
          size: mem.size,
          bank: mem.bank,
          type: mem.type,
          clockSpeed: mem.clockSpeed,
          formFactor: mem.formFactor,
          manufacturer: mem.manufacturer,
          partNum: mem.partNum,
          voltageConfigured: mem.voltageConfigured,
          formatted: {
            size: this.formatBytes(mem.size)
          }
        })),
        timestamp: Date.now()
      };

      // Add to history
      this.history.push({
        timestamp: stats.timestamp,
        usagePercent: stats.usagePercent,
        used: stats.used,
        available: stats.available
      });

      // Keep history size manageable
      if (this.history.length > this.maxHistoryLength) {
        this.history = this.history.slice(-this.maxHistoryLength);
      }

      stats.history = [...this.history];
      
      return stats;
    } catch (error) {
      console.error('Error getting memory stats:', error);
      return {
        total: 0,
        used: 0,
        free: 0,
        available: 0,
        usagePercent: 0,
        availablePercent: 0,
        layout: [],
        history: [],
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
}

module.exports = new MemoryMonitor();
