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
      // Get comprehensive network information
      const [networkInterfaces, networkStats, networkConnections, networkInterfaceDefault, networkGatewayDefault] = await Promise.all([
        si.networkInterfaces(),
        si.networkStats(),
        si.networkConnections().catch(() => []),
        si.networkInterfaceDefault().catch(() => ({})),
        si.networkGatewayDefault().catch(() => ({}))
      ]);
      
      // Update cached interfaces info
      this.networkInterfaces = networkInterfaces;


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
        const interfaceInfo = networkInterfaces.find(iface => iface.iface === netStat.iface);
        
        // Determine manufacturer from MAC address
        const manufacturer = this.getManufacturerFromMac(interfaceInfo?.mac);
        
        // Determine interface type and category
        const interfaceType = this.determineInterfaceType(netStat.iface, interfaceInfo);
        
        // Check if this is the default interface
        const isDefault = networkInterfaceDefault && 
          (networkInterfaceDefault === netStat.iface || 
           networkInterfaceDefault.iface === netStat.iface);

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
          isDefault,
          manufacturer,
          interfaceType,
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

      // Find primary interface for addressing info
      const primaryInterface = interfaceStats.find(iface => iface.isDefault) ||
        interfaceStats.find(iface => iface.operstate === 'up' && iface.info?.ip4) ||
        interfaceStats[0];

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
        addressing: await this.getNetworkAddressing(primaryInterface, networkGatewayDefault, networkInterfaces),
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

  /**
   * Get manufacturer from MAC address OUI (Organizationally Unique Identifier)
   * @param {string} mac - MAC address
   * @returns {string} - Manufacturer name or 'Unknown'
   */
  getManufacturerFromMac(mac) {
    if (!mac || mac === '00:00:00:00:00:00') {
      return 'Unknown';
    }

    // Get first 3 octets (OUI)
    const oui = mac.substring(0, 8).toUpperCase().replace(/:/g, '-');
    
    // Common OUI mappings - this is a subset of the full IEEE OUI database
    const ouiMap = {
      '00-50-56': 'VMware',
      '08-00-27': 'Oracle VirtualBox',
      '00-0C-29': 'VMware',
      '00-05-69': 'VMware',
      '00-1C-14': 'VMware',
      '00-15-5D': 'Microsoft Hyper-V',
      '00-16-3E': 'Xen VirtualPlatform',
      '52-54-00': 'QEMU/KVM',
      '02-00-4C': 'Docker',
      '00-1B-21': 'Intel',
      '00-E0-81': 'Tyan Computer',
      '00-50-B6': 'Cisco',
      '00-90-27': 'Intel',
      '00-A0-C9': 'Intel',
      '00-03-47': 'Intel',
      '00-12-3F': 'Intel',
      '00-15-17': 'Intel',
      '00-16-76': 'Intel',
      '00-19-D1': 'Intel',
      '00-1B-21': 'Intel',
      '00-1E-67': 'Intel',
      '00-21-70': 'Intel',
      '00-24-D7': 'Intel',
      '00-26-B9': 'Intel',
      '28-D2-44': 'Intel',
      '3C-97-0E': 'Intel',
      '40-A8-F0': 'Intel',
      '7C-7A-91': 'Intel',
      '8C-89-A5': 'Intel',
      'AC-22-0B': 'Intel',
      'B4-96-91': 'Intel',
      'E4-A7-A0': 'Intel',
      'E8-39-35': 'Intel',
      'F0-DE-F1': 'Intel',
      'F4-CE-46': 'Intel',
      '00-D0-B7': 'Realtek',
      '52-54-00': 'Realtek',
      '00-E0-4C': 'Realtek',
      '00-C0-9F': 'Qualcomm Atheros',
      '04-CE-14': 'Qualcomm Atheros',
      '20-F4-78': 'Qualcomm Atheros',
      '00-22-FB': 'Broadcom',
      '00-10-18': 'Broadcom',
      '00-14-A5': 'Broadcom',
      '00-1A-A0': 'Broadcom',
      '00-21-D8': 'Broadcom',
      'B8-27-EB': 'Raspberry Pi Foundation',
      'DC-A6-32': 'Raspberry Pi Foundation',
      'E4-5F-01': 'Raspberry Pi Foundation'
    };

    return ouiMap[oui] || 'Unknown';
  }

  /**
   * Determine interface type based on name and properties
   * @param {string} ifaceName - Interface name
   * @param {Object} interfaceInfo - Interface information object
   * @returns {Object} - Interface type information
   */
  determineInterfaceType(ifaceName, interfaceInfo) {
    const name = ifaceName.toLowerCase();
    
    // Virtual/Software interfaces
    if (interfaceInfo?.virtual || interfaceInfo?.internal) {
      return {
        category: 'virtual',
        type: 'Virtual',
        icon: '🔗',
        description: 'Virtual or internal interface'
      };
    }

    // Loopback
    if (name.includes('loopback') || name === 'lo' || name.startsWith('lo')) {
      return {
        category: 'loopback',
        type: 'Loopback',
        icon: '🔄',
        description: 'Loopback interface'
      };
    }

    // Ethernet interfaces
    if (name.includes('ethernet') || name.startsWith('eth') || name.startsWith('en')) {
      return {
        category: 'ethernet',
        type: 'Ethernet',
        icon: '🌐',
        description: 'Wired Ethernet connection'
      };
    }

    // WiFi interfaces
    if (name.includes('wi-fi') || name.includes('wireless') || name.startsWith('wlan') || 
        name.startsWith('wl') || name.includes('wifi') || name.startsWith('ath') ||
        name.startsWith('ra')) {
      return {
        category: 'wifi',
        type: 'WiFi',
        icon: '📶',
        description: 'Wireless network connection'
      };
    }

    // Bluetooth
    if (name.includes('bluetooth') || name.startsWith('bt') || name.includes('pan')) {
      return {
        category: 'bluetooth',
        type: 'Bluetooth',
        icon: '🔵',
        description: 'Bluetooth network connection'
      };
    }

    // VPN interfaces
    if (name.includes('vpn') || name.includes('tun') || name.includes('tap') || 
        name.startsWith('ppp') || name.includes('l2tp') || name.includes('pptp')) {
      return {
        category: 'vpn',
        type: 'VPN',
        icon: '🛡️',
        description: 'VPN tunnel interface'
      };
    }

    // Docker/Container interfaces
    if (name.includes('docker') || name.startsWith('veth') || name.includes('br-')) {
      return {
        category: 'container',
        type: 'Container',
        icon: '📦',
        description: 'Container network interface'
      };
    }

    // VM interfaces
    if (name.includes('vm') || name.includes('vbox') || name.includes('vmware') || 
        name.includes('hyperv')) {
      return {
        category: 'vm',
        type: 'Virtual Machine',
        icon: '💻',
        description: 'Virtual machine interface'
      };
    }

    // Bridge interfaces
    if (name.includes('bridge') || name.startsWith('br') || name.startsWith('virbr')) {
      return {
        category: 'bridge',
        type: 'Bridge',
        icon: '🌉',
        description: 'Network bridge interface'
      };
    }

    // Mobile/Cellular
    if (name.includes('cellular') || name.includes('mobile') || name.startsWith('wwan') ||
        name.includes('lte') || name.includes('3g') || name.includes('4g') || name.includes('5g')) {
      return {
        category: 'cellular',
        type: 'Cellular',
        icon: '📱',
        description: 'Mobile/Cellular connection'
      };
    }

    // Default/Unknown
    return {
      category: 'unknown',
      type: 'Unknown',
      icon: '❓',
      description: 'Unknown interface type'
    };
  }

  /**
   * Extract DNS servers from network interfaces or system configuration
   * @param {Array} networkInterfaces - Array of network interface information
   * @returns {string} - Comma-separated DNS servers or 'N/A'
   */
  extractDNSServers(networkInterfaces) {
    // Try to get DNS from active interfaces
    const dnsServers = new Set();
    
    networkInterfaces.forEach(iface => {
      if (iface.ip4 && !iface.internal) {
        // Check if interface has DNS configuration
        if (iface.dns && Array.isArray(iface.dns)) {
          iface.dns.forEach(dns => {
            if (dns && dns !== '0.0.0.0' && dns !== '127.0.0.1') {
              dnsServers.add(dns);
            }
          });
        }
      }
    });

    // If no DNS found in interfaces, try system command fallback
    if (dnsServers.size === 0) {
      try {
        const { exec } = require('child_process');
        // Try to get DNS from system (Windows)
        if (process.platform === 'win32') {
          return 'Auto-detected';
        }
        return 'N/A';
      } catch (error) {
        return 'N/A';
      }
    }

    return Array.from(dnsServers).join(', ');
  }

  /**
   * Get system network addressing information as fallback
   * @returns {Object} - Network addressing information
   */
  async getSystemNetworkInfo() {
    try {
      const { promisify } = require('util');
      const exec = promisify(require('child_process').exec);
      
      if (process.platform === 'win32') {
        // Windows: Use ipconfig to get network info
        const { stdout } = await exec('ipconfig /all');
        const info = this.parseWindowsIpconfig(stdout);
        return info;
      } else {
        // Unix-like systems
        const { stdout: routeOut } = await exec('ip route show default');
        const { stdout: dnsOut } = await exec('cat /etc/resolv.conf');
        return this.parseUnixNetworkInfo(routeOut, dnsOut);
      }
    } catch (error) {
      console.log('Could not get system network info:', error.message);
      return {
        localIP: 'N/A',
        gateway: 'N/A',
        dns: 'N/A',
        subnet: 'N/A'
      };
    }
  }

  /**
   * Parse Windows ipconfig output
   * @param {string} output - ipconfig output
   * @returns {Object} - Parsed network information
   */
  parseWindowsIpconfig(output) {
    const lines = output.split('\n');
    let localIP = 'N/A';
    let gateway = 'N/A';
    let subnet = 'N/A';
    let dns = 'N/A';
    
    const dnsServers = [];
    let currentAdapter = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.includes('adapter') && !trimmed.includes('Tunnel adapter')) {
        currentAdapter = trimmed;
      }
      
      if (trimmed.startsWith('IPv4 Address') || trimmed.startsWith('IP Address')) {
        const match = trimmed.match(/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/);
        if (match && !match[1].startsWith('169.254') && localIP === 'N/A') {
          localIP = match[1];
        }
      }
      
      if (trimmed.startsWith('Subnet Mask')) {
        const match = trimmed.match(/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/);
        if (match && subnet === 'N/A') {
          subnet = match[1];
        }
      }
      
      if (trimmed.startsWith('Default Gateway')) {
        const match = trimmed.match(/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/);
        if (match && gateway === 'N/A') {
          gateway = match[1];
        }
      }
      
      if (trimmed.startsWith('DNS Servers')) {
        const matches = trimmed.match(/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/g);
        if (matches) {
          matches.forEach(ip => dnsServers.push(ip));
        }
      }
      
      // Also look for additional DNS servers on separate lines
      if (trimmed.match(/^\s*([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\s*$/) && 
          lines[lines.indexOf(line) - 1]?.trim().startsWith('DNS Servers')) {
        const match = trimmed.match(/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/);
        if (match) {
          dnsServers.push(match[1]);
        }
      }
    }
    
    if (dnsServers.length > 0) {
      dns = dnsServers.slice(0, 2).join(', '); // Limit to first 2 DNS servers
    }
    
    return { localIP, gateway, dns, subnet };
  }

  /**
   * Parse Unix network information
   * @param {string} routeOutput - ip route output
   * @param {string} dnsOutput - resolv.conf output
   * @returns {Object} - Parsed network information
   */
  parseUnixNetworkInfo(routeOutput, dnsOutput) {
    let gateway = 'N/A';
    let dns = 'N/A';
    
    // Parse gateway from route output
    const routeMatch = routeOutput.match(/default via ([0-9\.]+)/);
    if (routeMatch) {
      gateway = routeMatch[1];
    }
    
    // Parse DNS from resolv.conf
    const dnsServers = [];
    const dnsLines = dnsOutput.split('\n');
    for (const line of dnsLines) {
      if (line.startsWith('nameserver')) {
        const server = line.split(' ')[1];
        if (server && !server.startsWith('127.')) {
          dnsServers.push(server);
        }
      }
    }
    
    if (dnsServers.length > 0) {
      dns = dnsServers.slice(0, 2).join(', ');
    }
    
    return {
      localIP: 'Auto-detected',
      gateway,
      dns,
      subnet: 'Auto-detected'
    };
  }

  /**
   * Get network addressing information combining interface and system data
   * @param {Object} primaryInterface - Primary network interface
   * @param {Object} gatewayDefault - Default gateway info from SI
   * @param {Array} networkInterfaces - All network interfaces
   * @returns {Object} - Combined network addressing information
   */
  async getNetworkAddressing(primaryInterface, gatewayDefault, networkInterfaces) {
    // Try to get from interface info first
    let addressing = {
      localIP: primaryInterface?.info?.ip4 || 'N/A',
      gateway: gatewayDefault?.gateway || 'N/A',
      subnet: primaryInterface?.info?.netmask || 'N/A',
      dns: this.extractDNSServers(networkInterfaces) || 'N/A'
    };

    // If we don't have complete info, try system commands as fallback
    const hasCompleteInfo = addressing.localIP !== 'N/A' && 
                           addressing.gateway !== 'N/A' && 
                           addressing.dns !== 'N/A';

    if (!hasCompleteInfo) {
      try {
        const systemInfo = await this.getSystemNetworkInfo();
        
        // Use system info for missing data
        if (addressing.localIP === 'N/A' && systemInfo.localIP !== 'N/A') {
          addressing.localIP = systemInfo.localIP;
        }
        if (addressing.gateway === 'N/A' && systemInfo.gateway !== 'N/A') {
          addressing.gateway = systemInfo.gateway;
        }
        if (addressing.dns === 'N/A' && systemInfo.dns !== 'N/A') {
          addressing.dns = systemInfo.dns;
        }
        if (addressing.subnet === 'N/A' && systemInfo.subnet !== 'N/A') {
          addressing.subnet = systemInfo.subnet;
        }
      } catch (error) {
        console.log('Could not get system network addressing info:', error.message);
      }
    }

    return addressing;
  }
}

module.exports = new NetworkMonitor();
