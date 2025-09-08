const si = require('systeminformation');

class StorageMonitor {
  constructor() {
    this.history = [];
    this.maxHistoryLength = 60;
    this.diskLayout = null;
    this.lastIoStats = null;
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
// Get disk layout info once
      if (!this.diskLayout) {
        try {
          this.diskLayout = await si.diskLayout();
        } catch (error) {
          console.warn('Could not get disk layout:', error.message);
          this.diskLayout = [];
        }
      }

// Get current filesystem info and disk I/O
      const [fsSize, blockDevices, disksIO] = await Promise.all([
        si.fsSize().catch(() => []),
        si.blockDevices().catch(() => []),
si.disksIO().catch(() => ({ rIO: 0, wIO: 0, tIO: 0, rIO_sec: 0, wIO_sec: 0, tIO_sec: 0, rTime: 0, wTime: 0 }))
      ]);

      // Calculate I/O rates - handle null disksIO response
      let ioRates = {
        readRate: 0,
        writeRate: 0,
        readOps: 0,
        writeOps: 0
      };

      if (disksIO && this.lastIoStats && disksIO.rIO !== undefined) {
        const timeDiff = (Date.now() - this.lastIoStats.timestamp) / 1000; // seconds
        if (timeDiff > 0) {
          ioRates.readRate = Math.max(0, (disksIO.rIO - this.lastIoStats.rIO) / timeDiff);
          ioRates.writeRate = Math.max(0, (disksIO.wIO - this.lastIoStats.wIO) / timeDiff);
          ioRates.readOps = Math.max(0, (disksIO.rIO_sec - this.lastIoStats.rIO_sec) / timeDiff);
          ioRates.writeOps = Math.max(0, (disksIO.wIO_sec - this.lastIoStats.wIO_sec) / timeDiff);
        }
      }

      // Store current I/O stats for next calculation (only if disksIO is valid)
      if (disksIO && disksIO.rIO !== undefined) {
        this.lastIoStats = {
          ...disksIO,
          timestamp: Date.now()
        };
      }

      const stats = {
        filesystem: (fsSize || []).map(fs => ({
          fs: fs.fs,
          type: fs.type,
          size: fs.size,
          used: fs.used,
          available: fs.available,
          use: fs.use,
          mount: fs.mount,
          usagePercent: fs.size > 0 ? Math.round((fs.used / fs.size) * 10000) / 100 : 0,
          formatted: {
            size: this.formatBytes(fs.size),
            used: this.formatBytes(fs.used),
            available: this.formatBytes(fs.available)
          }
        })),
        layout: (this.diskLayout || []).map(disk => ({
          device: disk.device,
          type: disk.type,
          name: disk.name,
          vendor: disk.vendor,
          size: disk.size,
          bytesPerSector: disk.bytesPerSector,
          totalCylinders: disk.totalCylinders,
          totalHeads: disk.totalHeads,
          totalSectors: disk.totalSectors,
          totalTracks: disk.totalTracks,
          tracksPerCylinder: disk.tracksPerCylinder,
          sectorsPerTrack: disk.sectorsPerTrack,
          firmwareRevision: disk.firmwareRevision,
          serialNum: disk.serialNum,
          interfaceType: disk.interfaceType,
          smartStatus: disk.smartStatus,
          temperature: disk.temperature,
          formatted: {
            size: this.formatBytes(disk.size)
          }
        })),
        blockDevices: blockDevices.map(block => ({
          name: block.name,
          identifier: block.identifier,
          type: block.type,
          fsType: block.fsType,
          mount: block.mount,
          size: block.size,
          physical: block.physical,
          uuid: block.uuid,
          label: block.label,
          model: block.model,
          serial: block.serial,
          removable: block.removable,
          protocol: block.protocol,
          formatted: {
            size: this.formatBytes(block.size)
          }
        })),
        io: {
          total: {
            read: disksIO?.rIO || 0,
            write: disksIO?.wIO || 0,
            readOps: disksIO?.rIO_sec || 0,
            writeOps: disksIO?.wIO_sec || 0,
            readTime: disksIO?.rTime || 0,
            writeTime: disksIO?.wTime || 0
          },
          rates: {
            read: ioRates.readRate,
            write: ioRates.writeRate,
            readOps: ioRates.readOps,
            writeOps: ioRates.writeOps,
            formatted: {
              read: this.formatBytes(ioRates.readRate),
              write: this.formatBytes(ioRates.writeRate)
            }
          }
        },
        timestamp: Date.now()
      };

      // Add to history
      this.history.push({
        timestamp: stats.timestamp,
        readRate: ioRates.readRate,
        writeRate: ioRates.writeRate,
totalUsage: stats.filesystem.length > 0 ? 
          stats.filesystem.reduce((acc, fs) => acc + fs.usagePercent, 0) / stats.filesystem.length : 0
      });

      // Keep history size manageable
      if (this.history.length > this.maxHistoryLength) {
        this.history = this.history.slice(-this.maxHistoryLength);
      }

      stats.history = [...this.history];
      
      return stats;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        filesystem: [],
        layout: [],
        blockDevices: [],
        io: {
          total: { read: 0, write: 0, readOps: 0, writeOps: 0 },
          rates: { read: 0, write: 0, readOps: 0, writeOps: 0 }
        },
        history: [],
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
}

module.exports = new StorageMonitor();
