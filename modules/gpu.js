const si = require('systeminformation');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class GPUMonitor {
  constructor() {
    this.history = [];
    this.maxHistoryLength = 60;
    this.gpuInfo = null;
    this.hasNvidiaSmi = null;
  }

  formatBytes(bytes) {
    if (bytes === 0) return { value: 0, unit: 'B' };
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = parseFloat((bytes / Math.pow(1024, i)).toFixed(2));
    
    return { value, unit: units[i] };
  }

  async checkNvidiaSmi() {
    if (this.hasNvidiaSmi !== null) return this.hasNvidiaSmi;
    
    try {
      await execAsync('nvidia-smi --version');
      this.hasNvidiaSmi = true;
    } catch {
      this.hasNvidiaSmi = false;
    }
    
    return this.hasNvidiaSmi;
  }

  async getNvidiaStats() {
    if (!(await this.checkNvidiaSmi())) return null;

    try {
      const { stdout } = await execAsync(
        'nvidia-smi --query-gpu=name,memory.total,memory.used,memory.free,utilization.gpu,temperature.gpu,power.draw,power.limit --format=csv,noheader,nounits'
      );
      
      const lines = stdout.trim().split('\n');
      const gpus = lines.map((line, index) => {
        const [name, memTotal, memUsed, memFree, utilization, temperature, powerDraw, powerLimit] = 
          line.split(', ').map(val => val.trim());
        
        const memTotalBytes = parseInt(memTotal) * 1024 * 1024; // MB to bytes
        const memUsedBytes = parseInt(memUsed) * 1024 * 1024;
        const memFreeBytes = parseInt(memFree) * 1024 * 1024;
        
        return {
          index,
          name,
          memory: {
            total: memTotalBytes,
            used: memUsedBytes,
            free: memFreeBytes,
            usagePercent: memTotalBytes > 0 ? (memUsedBytes / memTotalBytes) * 100 : 0,
            formatted: {
              total: this.formatBytes(memTotalBytes),
              used: this.formatBytes(memUsedBytes),
              free: this.formatBytes(memFreeBytes)
            }
          },
          utilization: parseFloat(utilization) || 0,
          temperature: parseFloat(temperature) || 0,
          power: {
            draw: parseFloat(powerDraw) || 0,
            limit: parseFloat(powerLimit) || 0
          }
        };
      });
      
      return gpus;
    } catch (error) {
      console.warn('Error getting NVIDIA GPU stats:', error.message);
      return null;
    }
  }

  async getStats() {
    try {
      // Get basic GPU info from systeminformation
      if (!this.gpuInfo) {
        this.gpuInfo = await si.graphics();
      }

      // Try to get detailed NVIDIA stats
      const nvidiaStats = await this.getNvidiaStats();
      
      const stats = {
        controllers: this.gpuInfo.controllers.map((controller, index) => ({
          vendor: controller.vendor,
          model: controller.model,
          bus: controller.bus,
          vram: controller.vram,
          vramDynamic: controller.vramDynamic,
          subDeviceId: controller.subDeviceId,
          driverVersion: controller.driverVersion,
          name: controller.name,
          pciBus: controller.pciBus,
          memoryTotal: controller.memoryTotal,
          memoryUsed: controller.memoryUsed,
          memoryFree: controller.memoryFree,
          utilizationGpu: controller.utilizationGpu,
          utilizationMemory: controller.utilizationMemory,
          temperatureGpu: controller.temperatureGpu,
          fanSpeed: controller.fanSpeed,
          memoryUsagePercent: controller.memoryTotal > 0 ? 
            (controller.memoryUsed / controller.memoryTotal) * 100 : 0,
          // Merge with NVIDIA data if available
          ...(nvidiaStats && nvidiaStats[index] ? {
            memory: nvidiaStats[index].memory,
            utilization: nvidiaStats[index].utilization,
            temperature: nvidiaStats[index].temperature,
            power: nvidiaStats[index].power
          } : {})
        })),
        displays: this.gpuInfo.displays,
        timestamp: Date.now()
      };

      // Add to history (use first GPU for history)
      if (stats.controllers.length > 0) {
        const primaryGpu = stats.controllers[0];
        this.history.push({
          timestamp: stats.timestamp,
          utilization: primaryGpu.utilization || primaryGpu.utilizationGpu || 0,
          memoryUsagePercent: primaryGpu.memory?.usagePercent || primaryGpu.memoryUsagePercent || 0,
          temperature: primaryGpu.temperature || primaryGpu.temperatureGpu || 0
        });

        // Keep history size manageable
        if (this.history.length > this.maxHistoryLength) {
          this.history = this.history.slice(-this.maxHistoryLength);
        }
      }

      stats.history = [...this.history];
      
      return stats;
    } catch (error) {
      console.error('Error getting GPU stats:', error);
      return {
        controllers: [],
        displays: [],
        history: [],
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
}

module.exports = new GPUMonitor();
