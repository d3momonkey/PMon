/**
 * PMon - Performance Monitor
 * Motherboard Information Module
 * 
 * @description Motherboard, BIOS, and system hardware information collection
 * @author Craig Raymond
 * @developer DemoMonkey Studios
 * @version 1.0.3
 * @license MIT
 */

const si = require('systeminformation');

class MotherboardMonitor {
  constructor() {
    this.lastUpdate = 0;
    this.updateInterval = 10000; // Update every 10 seconds (motherboard info doesn't change often)
    this.cachedInfo = null;
  }

  /**
   * Get comprehensive motherboard information
   * @returns {Promise<Object>} Motherboard stats and information
   */
  async getStats() {
    const now = Date.now();
    
    // Use cached data if recent (motherboard info is mostly static)
    if (this.cachedInfo && (now - this.lastUpdate) < this.updateInterval) {
      return {
        ...this.cachedInfo,
        timestamp: now
      };
    }

    try {
      console.log('Fetching motherboard information...');
      
      // Get all motherboard-related information in parallel
      const [
        baseboard,
        bios,
        system,
        chassis,
        memLayout,
        graphics,
        audio,
        usb,
        networkInterfaces
      ] = await Promise.all([
        si.baseboard(),
        si.bios(),
        si.system(),
        si.chassis(),
        si.memLayout(),
        si.graphics(),
        si.audio(),
        si.usb(),
        si.networkInterfaces()
      ]);

      const motherboardStats = {
        timestamp: now,
        
        // Core motherboard info
        motherboard: {
          manufacturer: baseboard.manufacturer || 'Unknown',
          model: baseboard.model || 'Unknown',
          version: baseboard.version || 'Unknown',
          serialNumber: baseboard.serial || 'Not Available',
          assetTag: baseboard.assetTag || 'Not Available',
          memMax: baseboard.memMax || null,
          memSlots: baseboard.memSlots || 0
        },

        // BIOS/UEFI information
        bios: {
          vendor: bios.vendor || 'Unknown',
          version: bios.version || 'Unknown',
          releaseDate: bios.releaseDate || 'Unknown',
          revision: bios.revision || 'Unknown',
          features: bios.features || []
        },

        // System information
        system: {
          manufacturer: system.manufacturer || 'Unknown',
          model: system.model || 'Unknown',
          version: system.version || 'Unknown',
          serial: system.serial || 'Not Available',
          uuid: system.uuid || 'Not Available',
          sku: system.sku || 'Not Available'
        },

        // Chassis information
        chassis: {
          manufacturer: chassis.manufacturer || 'Unknown',
          model: chassis.model || 'Unknown',
          type: chassis.type || 'Unknown',
          version: chassis.version || 'Unknown',
          serial: chassis.serial || 'Not Available',
          assetTag: chassis.assetTag || 'Not Available'
        },

        // Memory slots and configuration
        memory: {
          slots: memLayout.map(slot => ({
            size: slot.size || 0,
            type: slot.type || 'Unknown',
            formFactor: slot.formFactor || 'Unknown',
            manufacturer: slot.manufacturer || 'Unknown',
            partNum: slot.partNum || 'Unknown',
            serialNum: slot.serialNum || 'Not Available',
            voltageConfigured: slot.voltageConfigured || null,
            voltageMin: slot.voltageMin || null,
            voltageMax: slot.voltageMax || null,
            clockConfigured: slot.clockConfigured || null,
            bankLabel: slot.bankLabel || 'Unknown',
            deviceLocator: slot.deviceLocator || 'Unknown'
          })),
          totalSlots: memLayout.length,
          occupiedSlots: memLayout.filter(slot => slot.size > 0).length,
          totalMemory: memLayout.reduce((sum, slot) => sum + (slot.size || 0), 0)
        },

        // Expansion slots and cards
        expansionSlots: {
          graphics: graphics.controllers.map(gpu => ({
            vendor: gpu.vendor || 'Unknown',
            model: gpu.model || 'Unknown',
            bus: gpu.bus || 'Unknown',
            busAddress: gpu.busAddress || 'Unknown',
            vram: gpu.vram || 0,
            vramDynamic: gpu.vramDynamic || false
          })),
          
          audio: audio.map(device => ({
            name: device.name || 'Unknown Audio Device',
            manufacturer: device.manufacturer || 'Unknown',
            revision: device.revision || 'Unknown',
            driver: device.driver || 'Unknown'
          })),
          
          network: networkInterfaces
            .filter(iface => !iface.internal && iface.mac)
            .map(iface => ({
              name: iface.iface || 'Unknown',
              type: iface.type || 'Unknown',
              speed: iface.speed || null,
              mac: iface.mac || 'Unknown',
              vendor: iface.vendor || 'Unknown'
            }))
        },

        // USB controllers and ports
        usb: {
          controllers: usb.filter(device => device.type === 'USB Controller').map(ctrl => ({
            name: ctrl.name || 'Unknown USB Controller',
            vendor: ctrl.vendor || 'Unknown',
            type: ctrl.type || 'Unknown',
            deviceId: ctrl.deviceId || 'Unknown'
          })),
          devices: usb.filter(device => device.type !== 'USB Controller').map(device => ({
            name: device.name || 'Unknown USB Device',
            vendor: device.vendor || 'Unknown',
            type: device.type || 'Unknown',
            deviceId: device.deviceId || 'Unknown',
            removable: device.removable || false
          }))
        },

        // Calculated statistics
        stats: {
          memoryUtilization: memLayout.length > 0 ? 
            (memLayout.filter(slot => slot.size > 0).length / memLayout.length) * 100 : 0,
          totalExpansionCards: 
            (graphics.controllers?.length || 0) + 
            (audio?.length || 0) + 
            (networkInterfaces?.filter(iface => !iface.internal).length || 0),
          usbDeviceCount: usb.filter(device => device.type !== 'USB Controller').length || 0,
          biosAge: this.calculateBiosAge(bios.releaseDate)
        }
      };

      // Cache the results
      this.cachedInfo = motherboardStats;
      this.lastUpdate = now;

      console.log('Motherboard information collected successfully');
      return motherboardStats;

    } catch (error) {
      console.error('Error fetching motherboard information:', error);
      
      // Return basic error state
      return {
        timestamp: now,
        error: true,
        message: 'Unable to retrieve motherboard information',
        motherboard: { manufacturer: 'Error', model: 'Unable to detect' },
        bios: { vendor: 'Error', version: 'Unable to detect' },
        system: { manufacturer: 'Error', model: 'Unable to detect' },
        chassis: { type: 'Unknown' },
        memory: { slots: [], totalSlots: 0 },
        expansionSlots: { graphics: [], audio: [], network: [] },
        usb: { controllers: [], devices: [] },
        stats: { memoryUtilization: 0, totalExpansionCards: 0, usbDeviceCount: 0, biosAge: null }
      };
    }
  }

  /**
   * Calculate BIOS age in days
   * @param {string} releaseDate - BIOS release date
   * @returns {number|null} Age in days or null if unknown
   */
  calculateBiosAge(releaseDate) {
    if (!releaseDate || releaseDate === 'Unknown') return null;
    
    try {
      const biosDate = new Date(releaseDate);
      const now = new Date();
      const diffTime = Math.abs(now - biosDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return null;
    }
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes - Bytes to format
   * @returns {Object} Formatted size with value and unit
   */
  formatBytes(bytes) {
    if (bytes === 0) return { value: 0, unit: 'B' };
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return {
      value: parseFloat((bytes / Math.pow(k, i)).toFixed(2)),
      unit: sizes[i]
    };
  }

  /**
   * Get motherboard health summary
   * @returns {Promise<Object>} Health status and recommendations
   */
  async getHealthSummary() {
    const stats = await this.getStats();
    
    if (stats.error) {
      return {
        status: 'error',
        score: 0,
        issues: ['Cannot retrieve motherboard information']
      };
    }

    const issues = [];
    let score = 100;

    // Check BIOS age
    if (stats.stats.biosAge > 730) { // Older than 2 years
      issues.push('BIOS is quite old, consider updating');
      score -= 10;
    }

    // Check memory utilization
    if (stats.stats.memoryUtilization < 50) {
      issues.push('Less than 50% of memory slots are used');
      score -= 5;
    }

    // Check for unknown components
    if (stats.motherboard.manufacturer === 'Unknown') {
      issues.push('Motherboard manufacturer not detected');
      score -= 15;
    }

    return {
      status: score >= 80 ? 'good' : score >= 60 ? 'warning' : 'critical',
      score,
      issues,
      recommendations: this.getRecommendations(stats)
    };
  }

  /**
   * Get system recommendations based on motherboard info
   * @param {Object} stats - Motherboard statistics
   * @returns {Array} Array of recommendations
   */
  getRecommendations(stats) {
    const recommendations = [];

    if (stats.stats.memoryUtilization < 50) {
      recommendations.push('Consider adding more RAM modules to utilize available slots');
    }

    if (stats.stats.biosAge > 365) {
      recommendations.push('Check for BIOS updates to improve compatibility and security');
    }

    if (stats.usb.devices.length > 10) {
      recommendations.push('Consider using a powered USB hub if experiencing power issues');
    }

    return recommendations;
  }
}

module.exports = new MotherboardMonitor();
