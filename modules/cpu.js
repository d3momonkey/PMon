/**
 * PMon - Performance Monitor
 * CPU Monitoring Module
 * 
 * @description CPU performance monitoring and information collection
 * @author Craig Raymond
 * @developer DemoMonkey Studios
 * @version 1.0.3
 * @license MIT
 */

const si = require('systeminformation');

class CPUMonitor {
  constructor() {
    this.history = [];
    this.maxHistoryLength = 60; // Keep 1 minute of history
    this.cpuInfo = null;
  }

  async getStats() {
    try {
      // Get CPU info once on first call
      if (!this.cpuInfo) {
        this.cpuInfo = await si.cpu();
      }

      // Get current CPU load
      const currentLoad = await si.currentLoad();
      
      const stats = {
        usage: Math.round(currentLoad.currentLoad * 100) / 100,
        usageIdle: Math.round(currentLoad.currentLoadIdle * 100) / 100,
        cores: currentLoad.cpus.map(cpu => ({
          usage: Math.round(cpu.load * 100) / 100,
          loadUser: Math.round(cpu.loadUser * 100) / 100,
          loadSystem: Math.round(cpu.loadSystem * 100) / 100
        })),
        info: {
          manufacturer: this.cpuInfo.manufacturer,
          brand: this.cpuInfo.brand,
          family: this.cpuInfo.family,
          model: this.cpuInfo.model,
          speed: this.cpuInfo.speed,
          speedMin: this.cpuInfo.speedMin,
          speedMax: this.cpuInfo.speedMax,
          cores: this.cpuInfo.cores,
          physicalCores: this.cpuInfo.physicalCores,
          processors: this.cpuInfo.processors,
          socket: this.cpuInfo.socket,
          cache: this.cpuInfo.cache
        },
        timestamp: Date.now()
      };

      // Add to history
      this.history.push({
        timestamp: stats.timestamp,
        usage: stats.usage,
        cores: stats.cores.map(core => core.usage)
      });

      // Keep history size manageable
      if (this.history.length > this.maxHistoryLength) {
        this.history = this.history.slice(-this.maxHistoryLength);
      }

      stats.history = [...this.history];
      
      return stats;
    } catch (error) {
      console.error('Error getting CPU stats:', error);
      return {
        usage: 0,
        cores: [],
        info: null,
        history: [],
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  getTemperature() {
    // CPU temperature - will implement if needed
    return si.cpuTemperature().catch(() => ({ main: null }));
  }
}

module.exports = new CPUMonitor();
