const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class NPUMonitor {
  constructor() {
    this.history = [];
    this.maxHistoryLength = 60;
    this.npuInfo = null;
    this.hasIntelNpu = null;
    this.hasAppleNpu = null;
  }

  async checkIntelNPU() {
    if (this.hasIntelNpu !== null) return this.hasIntelNpu;
    
    try {
      // Check for Intel NPU via Windows Device Manager or Linux lspci
      if (process.platform === 'win32') {
        // Use multiple specific queries to avoid false positives from "Input" devices
        const queries = [
          'wmic path win32_pnpentity where "name like \'%Neural%\'" get name',
          'wmic path win32_pnpentity where "name like \'%Intel NPU%\'" get name',
          'wmic path win32_pnpentity where "description like \'%Neural Processing%\'" get name'
        ];
        
        let npuFound = false;
        for (const query of queries) {
          try {
            const { stdout } = await execAsync(query);
            if (stdout && !stdout.includes('No Instance(s) Available')) {
              const lines = stdout.split('\n').map(line => line.trim()).filter(line => line.length > 0 && line !== 'Name');
              if (lines.length > 0) {
                npuFound = true;
                break;
              }
            }
          } catch (err) {
            // Continue to next query
          }
        }
        this.hasIntelNpu = npuFound;
      } else if (process.platform === 'linux') {
        const { stdout } = await execAsync('lspci | grep -i "neural\\|npu"');
        this.hasIntelNpu = stdout.length > 0;
      } else {
        this.hasIntelNpu = false;
      }
    } catch {
      this.hasIntelNpu = false;
    }
    
    return this.hasIntelNpu;
  }

  async checkAppleNPU() {
    if (this.hasAppleNpu !== null) return this.hasAppleNpu;
    
    if (process.platform !== 'darwin') {
      this.hasAppleNpu = false;
      return false;
    }
    
    try {
      const { stdout } = await execAsync('system_profiler SPHardwareDataType');
      this.hasAppleNpu = stdout.includes('Neural Engine') || stdout.includes('Apple');
    } catch {
      this.hasAppleNpu = false;
    }
    
    return this.hasAppleNpu;
  }

  async getIntelNPUStats() {
    if (!(await this.checkIntelNPU())) return null;
    
    try {
      // Real Intel NPU monitoring would require Intel's NPU monitoring tools
      // or proprietary APIs when available. For now, we only detect presence.
      // Return null since we cannot get real stats without proper Intel NPU SDK
      console.log('Intel NPU detected but monitoring APIs not available');
      return null;
    } catch (error) {
      console.warn('Error getting Intel NPU stats:', error.message);
      return null;
    }
  }

  async getAppleNPUStats() {
    if (!(await this.checkAppleNPU())) return null;
    
    try {
      // Real Apple Neural Engine monitoring would require macOS-specific APIs
      // For now, we only detect presence.
      // Return null since we cannot get real stats without proper Apple APIs
      console.log('Apple Neural Engine detected but monitoring APIs not available');
      return null;
    } catch (error) {
      console.warn('Error getting Apple NPU stats:', error.message);
      return null;
    }
  }

  async getStats() {
    try {
      const [intelStats, appleStats] = await Promise.all([
        this.getIntelNPUStats(),
        this.getAppleNPUStats()
      ]);

      const npus = [];
      
      if (intelStats) {
        npus.push({
          type: 'intel',
          ...intelStats
        });
      }
      
      if (appleStats) {
        npus.push({
          type: 'apple',
          ...appleStats
        });
      }

      // NPU is only "available" if we have actual stats, not just detection
      const stats = {
        available: npus.length > 0,  // Only true if we have working NPU stats
        npus: npus,
        detected: (await this.checkIntelNPU()) || (await this.checkAppleNPU()), // Track detection separately
        timestamp: Date.now()
      };

      // Add to history if we have NPU data
      if (npus.length > 0) {
        const primaryNpu = npus[0];
        this.history.push({
          timestamp: stats.timestamp,
          utilization: primaryNpu.utilization || 0,
          power: primaryNpu.power || 0,
          temperature: primaryNpu.temperature || 0
        });

        // Keep history size manageable
        if (this.history.length > this.maxHistoryLength) {
          this.history = this.history.slice(-this.maxHistoryLength);
        }
      }

      stats.history = [...this.history];
      
      return stats;
    } catch (error) {
      console.error('Error getting NPU stats:', error);
      return {
        available: false,
        npus: [],
        history: [],
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
}

module.exports = new NPUMonitor();
