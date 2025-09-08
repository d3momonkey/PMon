const EventEmitter = require('events');
const cpuModule = require('./cpu');
const memoryModule = require('./memory');
const gpuModule = require('./gpu');
const npuModule = require('./npu');
const storageModule = require('./storage');
const networkModule = require('./network');

class MonitoringService extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.updateInterval = null;
    this.stats = {
      timestamp: Date.now(),
      cpu: null,
      memory: null,
      gpu: null,
      npu: null,
      storage: null,
      network: null
    };
  }

  async start() {
    if (this.isRunning) return;
    
    console.log('Starting PMon monitoring service...');
    this.isRunning = true;
    
    // Get initial stats
    await this.updateStats();
    
    // Start regular updates (every 1000ms for most metrics)
    this.updateInterval = setInterval(async () => {
      await this.updateStats();
    }, 1000);
    
    console.log('PMon monitoring service started');
  }

  stop() {
    if (!this.isRunning) return;
    
    console.log('Stopping PMon monitoring service...');
    this.isRunning = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    console.log('PMon monitoring service stopped');
  }

  async updateStats() {
    const timestamp = Date.now();
    
    try {
      // Update CPU and Memory every second (lightweight)
      const [cpuStats, memoryStats, networkStats] = await Promise.all([
        cpuModule.getStats(),
        memoryModule.getStats(),
        networkModule.getStats()
      ]);

      this.stats.cpu = cpuStats;
      this.stats.memory = memoryStats;
      this.stats.network = networkStats;

      // Update heavier metrics less frequently
      const shouldUpdateHeavy = timestamp % 3000 < 1000; // Every 3 seconds
      
      if (shouldUpdateHeavy) {
        const [gpuStats, npuStats, storageStats] = await Promise.all([
          gpuModule.getStats(),
          npuModule.getStats(),
          storageModule.getStats()
        ]);

        this.stats.gpu = gpuStats;
        this.stats.npu = npuStats;
        this.stats.storage = storageStats;
      }

      this.stats.timestamp = timestamp;
      
      // Emit updated stats
      this.emit('stats-update', { ...this.stats });
      
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  getLastStats() {
    return { ...this.stats };
  }
}

module.exports = MonitoringService;
