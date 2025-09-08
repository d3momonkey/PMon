const si = require('systeminformation');

class NetworkMonitor {
  constructor() {
    this.history = [];
    this.maxHistoryLength = 60;
    this.networkInterfaces = null;
    this.lastNetworkStats = null;
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
      // Get network interfaces info once
      if (!this.networkInterfaces) {
        this.networkInterfaces = await si.networkInterfaces();
      }

      // Get current network stats
      const [networkStats, networkConnections] = await Promise.all([
        si.networkStats(),
        si.networkConnections().catch(() => [])
      ]);

      // Calculate rates
      let totalRates = {
        rxRate: 0,
        txRate: 0
      };

      const interfaceStats = networkStats.map(netStat => {
        let rates = {
          rxRate: 0,
          txRate: 0
        };

        // Calculate rates if we have previous stats
        if (this.lastNetworkStats) {
          const lastStat = this.lastNetworkStats.find(s => s.iface === netStat.iface);
          if (lastStat) {
            const timeDiff = (Date.now() - lastStat.timestamp) / 1000; // seconds
            if (timeDiff > 0) {
              rates.rxRate = Math.max(0, (netStat.rx_bytes - lastStat.rx_bytes) / timeDiff);
              rates.txRate = Math.max(0, (netStat.tx_bytes - lastStat.tx_bytes) / timeDiff);
            }
          }
        }

        totalRates.rxRate += rates.rxRate;
        totalRates.txRate += rates.txRate;

        // Find matching interface info
        const interfaceInfo = this.networkInterfaces.find(iface => iface.iface === netStat.iface);

        return {
          iface: netStat.iface,
          operstate: netStat.operstate,
          rx_bytes: netStat.rx_bytes,
          rx_dropped: netStat.rx_dropped,
          rx_errors: netStat.rx_errors,
          tx_bytes: netStat.tx_bytes,
          tx_dropped: netStat.tx_dropped,
          tx_errors: netStat.tx_errors,
          rx_sec: netStat.rx_sec,
          tx_sec: netStat.tx_sec,
          ms: netStat.ms,
          rates: {
            rx: rates.rxRate,
            tx: rates.txRate,
            formatted: {
              rx: this.formatBytes(rates.rxRate),
              tx: this.formatBytes(rates.txRate)
            }
          },
          totals: {
            formatted: {
              rx: this.formatBytes(netStat.rx_bytes),
              tx: this.formatBytes(netStat.tx_bytes)
            }
          },
          info: interfaceInfo ? {
            ip4: interfaceInfo.ip4,
            ip6: interfaceInfo.ip6,
            mac: interfaceInfo.mac,
            internal: interfaceInfo.internal,
            virtual: interfaceInfo.virtual,
            type: interfaceInfo.type,
            duplex: interfaceInfo.duplex,
            mtu: interfaceInfo.mtu,
            speed: interfaceInfo.speed,
            dhcp: interfaceInfo.dhcp,
            dnsSuffix: interfaceInfo.dnsSuffix,
            ieee8021xAuth: interfaceInfo.ieee8021xAuth,
            ieee8021xState: interfaceInfo.ieee8021xState,
            carrierChanges: interfaceInfo.carrierChanges
          } : null,
          timestamp: Date.now()
        };
      });

      // Store current stats for next rate calculation
      this.lastNetworkStats = networkStats.map(stat => ({
        ...stat,
        timestamp: Date.now()
      }));

      // Get connection info
      const activeConnections = networkConnections.filter(conn => 
        conn.state === 'ESTABLISHED' || conn.state === 'LISTEN'
      );

      const connectionsByState = {
        ESTABLISHED: activeConnections.filter(c => c.state === 'ESTABLISHED').length,
        LISTEN: activeConnections.filter(c => c.state === 'LISTEN').length,
        TIME_WAIT: networkConnections.filter(c => c.state === 'TIME_WAIT').length,
        CLOSE_WAIT: networkConnections.filter(c => c.state === 'CLOSE_WAIT').length
      };

      const stats = {
        interfaces: interfaceStats,
        connections: {
          active: activeConnections.length,
          total: networkConnections.length,
          byState: connectionsByState,
          details: activeConnections.map(conn => ({
            protocol: conn.protocol,
            localAddress: conn.localAddress,
            localPort: conn.localPort,
            peerAddress: conn.peerAddress,
            peerPort: conn.peerPort,
            state: conn.state,
            pid: conn.pid,
            process: conn.process
          }))
        },
        totals: {
          rates: {
            rx: totalRates.rxRate,
            tx: totalRates.txRate,
            formatted: {
              rx: this.formatBytes(totalRates.rxRate),
              tx: this.formatBytes(totalRates.txRate)
            }
          },
          bytes: {
            rx: interfaceStats.reduce((sum, iface) => sum + iface.rx_bytes, 0),
            tx: interfaceStats.reduce((sum, iface) => sum + iface.tx_bytes, 0)
          }
        },
        timestamp: Date.now()
      };

      // Add to history
      this.history.push({
        timestamp: stats.timestamp,
        rxRate: totalRates.rxRate,
        txRate: totalRates.txRate,
        connections: activeConnections.length
      });

      // Keep history size manageable
      if (this.history.length > this.maxHistoryLength) {
        this.history = this.history.slice(-this.maxHistoryLength);
      }

      stats.history = [...this.history];
      
      return stats;
    } catch (error) {
      console.error('Error getting network stats:', error);
      return {
        interfaces: [],
        connections: {
          active: 0,
          total: 0,
          byState: {},
          details: []
        },
        totals: {
          rates: { rx: 0, tx: 0 },
          bytes: { rx: 0, tx: 0 }
        },
        history: [],
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
}

module.exports = new NetworkMonitor();
