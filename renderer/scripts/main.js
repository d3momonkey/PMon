class PMon {
  constructor() {
    this.chartManager = new ChartManager();
    this.currentSection = 'overview';
    this.lastStats = null;
    this.isConnected = false;
    
    this.init();
  }

  init() {
    console.log('Initializing PMon...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
    } else {
      this.onDOMReady();
    }
  }

  onDOMReady() {
    this.setupEventListeners();
    this.setupNavigation();
    this.initializeCharts();
    this.setupDataListener();
    this.loadTheme();
    
    console.log('PMon initialized successfully');
  }

  setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.section;
        this.navigateToSection(section);
      });
    });

    // Use event delegation for metric cards to handle dynamically created content
    const overviewGrid = document.querySelector('.overview-grid');
    if (overviewGrid) {
      overviewGrid.addEventListener('click', (e) => {
        // Find the closest metric card
        const card = e.target.closest('.metric-card');
        if (card) {
          e.preventDefault();
          e.stopPropagation();
          
          // Find the specific card type, not 'metric-card'
          const cardClass = Array.from(card.classList).find(cls => 
            cls.endsWith('-card') && cls !== 'metric-card'
          );
          if (cardClass) {
            const section = cardClass.replace('-card', '');
            this.navigateToSection(section);
          }
        }
      });
    }

    // Also set up direct listeners as backup
    setTimeout(() => this.setupCardListeners(), 500);

    // Handle theme change events
    window.addEventListener('theme-changed', () => this.onThemeChanged());
  }

  setupCardListeners() {
    const metricCards = document.querySelectorAll('.metric-card');
    
    if (metricCards.length === 0) {
      return;
    }
    
    metricCards.forEach((card) => {
      // Add visual feedback
      card.style.cursor = 'pointer';
      card.style.transition = 'transform 0.2s ease';
      
      // Add click handler
      card.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const cardClasses = Array.from(this.classList);
        
        // Find the specific card type, not 'metric-card'
        const cardClass = cardClasses.find(cls => 
          cls.endsWith('-card') && cls !== 'metric-card'
        );
        
        if (cardClass) {
          const section = cardClass.replace('-card', '');
          
          // Get the PMon instance from the global scope
          if (window.pmonInstance) {
            window.pmonInstance.navigateToSection(section);
          }
        }
      });
      
      // Add hover effects
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
      });
      
      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
      });
    });
  }

  setupNavigation() {
    // Set initial active state
    this.navigateToSection('overview');
  }

  navigateToSection(sectionName) {
    // Update navigation active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.remove('active');
    });
    
    const navItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (navItem) {
      navItem.classList.add('active');
    }

    // Update content sections
    const contentSections = document.querySelectorAll('.content-section');
    contentSections.forEach(section => {
      section.classList.remove('active');
    });

    const section = document.getElementById(`${sectionName}-section`);
    
    if (section) {
      section.classList.add('active');
      this.currentSection = sectionName;
      
      // Ensure the section has visible content immediately
      this.ensureSectionContent(sectionName);
      
      // Initialize section-specific charts if needed
      this.initializeSectionCharts(sectionName);
      
      // Force update content for the new section if we have data
      if (this.lastStats) {
        this.updateDetailedSections(this.lastStats);
        setTimeout(() => {
          this.updateDetailedSections(this.lastStats);
        }, 100);
      } else {
        this.showLoadingContent(sectionName);
      }
    }
  }

  initializeCharts() {
    // Initialize overview mini charts
    this.chartManager.createCPUChart('cpu-mini-chart', false);
    this.chartManager.createGPUChart('gpu-mini-chart', false);  
    this.chartManager.createNetworkChart('network-mini-chart', false);
  }

initializeSectionCharts(sectionName) {
    switch (sectionName) {
      case 'cpu':
        if (!this.chartManager.charts.has('cpu-main-chart')) {
          this.chartManager.createCPUChart('cpu-main-chart', true);
        }
        break;
      case 'memory':
        if (!this.chartManager.charts.has('memory-main-chart')) {
          this.chartManager.createMemoryChart('memory-main-chart', true);
        }
        break;
      case 'gpu':
        // GPU chart will be created when updateDetailedContent runs
        // But ensure the content structure exists
        const gpuContent = document.getElementById('gpu-content');
        if (gpuContent && !gpuContent.querySelector('.detail-grid')) {
          this.ensureGPUContent();
        }
        break;
      case 'storage':
        // Ensure storage content is initialized
        this.ensureStorageContent();
        break;
      case 'network':
        // Ensure network content is initialized
        this.ensureNetworkContent();
        break;
      case 'npu':
        // NPU content will be updated when data arrives
        break;
      case 'motherboard':
        // Ensure motherboard content is initialized
        this.ensureMotherboardContent();
        break;
    }
  }

  setupDataListener() {
    // Check if API is available
    if (typeof window.api !== 'undefined') {
      // Listen for stats updates
      window.api.onStats((stats) => {
        this.handleStatsUpdate(stats);
      });

      // Request initial stats
      window.api.requestInitialStats().then(stats => {
        if (stats) {
          this.handleStatsUpdate(stats);
        }
      });

      this.isConnected = true;
      console.log('Connected to monitoring service');
    } else {
      console.warn('API not available - using mock data');
      this.startMockData();
    }
  }

  handleStatsUpdate(stats) {
    try {
      this.lastStats = stats;
      this.updateLastUpdatedTime();
      
      // Update overview cards
      this.updateOverviewCards(stats);
      
      // Update detailed sections if active
      this.updateDetailedSections(stats);
    } catch (error) {
      console.error('Error in handleStatsUpdate:', error);
    }
  }

  updateOverviewCards(stats) {
    // CPU Card
    if (stats.cpu) {
      const cpuUsage = document.getElementById('cpu-usage');
      const cpuName = document.getElementById('cpu-name');
      
      if (cpuUsage) cpuUsage.textContent = `${stats.cpu.usage.toFixed(1)}%`;
      if (cpuName && stats.cpu.info) cpuName.textContent = stats.cpu.info.brand || 'Unknown CPU';
      
      // Update mini chart
      this.chartManager.updateChart('cpu-mini-chart', stats.cpu.usage);
    }

    // Memory Card
    if (stats.memory) {
      const memoryUsage = document.getElementById('memory-usage');
      const memoryDetails = document.getElementById('memory-details');
      
      if (memoryUsage) memoryUsage.textContent = `${stats.memory.usagePercent.toFixed(1)}%`;
      if (memoryDetails && stats.memory.formatted) {
        memoryDetails.textContent = `${stats.memory.formatted.used.value} ${stats.memory.formatted.used.unit} / ${stats.memory.formatted.total.value} ${stats.memory.formatted.total.unit}`;
      }
      
      // Update progress ring
      this.chartManager.updateMemoryRing(stats.memory.usagePercent);
    }

    // GPU Card
    if (stats.gpu && stats.gpu.controllers.length > 0) {
      const gpu = stats.gpu.controllers[0];
      const gpuUsage = document.getElementById('gpu-usage');
      const gpuName = document.getElementById('gpu-name');
      
      const usage = gpu.utilization || gpu.utilizationGpu || 0;
      if (gpuUsage) gpuUsage.textContent = `${usage.toFixed(1)}%`;
      if (gpuName) gpuName.textContent = gpu.name || gpu.model || 'Unknown GPU';
      
      // Update mini chart
      this.chartManager.updateChart('gpu-mini-chart', usage);
    }

    // Storage Card
    if (stats.storage && stats.storage.filesystem && stats.storage.filesystem.length > 0) {
      const storageUsage = document.getElementById('storage-usage');
      const storageDetails = document.getElementById('storage-details');
      
      // Calculate total storage statistics
      let totalSize = 0;
      let totalUsed = 0;
      let totalAvailable = 0;
      
      stats.storage.filesystem.forEach(fs => {
        totalSize += fs.size || 0;
        totalUsed += fs.used || 0;
        totalAvailable += fs.available || 0;
      });
      
      const totalUsagePercent = totalSize > 0 ? (totalUsed / totalSize) * 100 : 0;
      
      if (storageUsage) storageUsage.textContent = `${totalUsagePercent.toFixed(1)}%`;
      if (storageDetails) {
        const formattedUsed = this.chartManager.formatBytes(totalUsed);
        const formattedTotal = this.chartManager.formatBytes(totalSize);
        storageDetails.textContent = `${formattedUsed} / ${formattedTotal}`;
      }
      
      // Update storage progress ring instead of bars
      this.chartManager.updateStorageRing(totalUsagePercent);
    }

    // Network Card
    if (stats.network) {
      const networkType = document.getElementById('network-type');
      const networkDetails = document.getElementById('network-details');
      
      // Find primary/default interface and determine network type
      if (networkType) {
        let primaryInterfaceType = 'Unknown';
        
        // Look for the default interface first
        const defaultInterface = stats.network.interfaces.find(iface => iface.isDefault);
        if (defaultInterface && defaultInterface.interfaceType) {
          primaryInterfaceType = defaultInterface.interfaceType.type;
        } else {
          // If no default, find the first active non-loopback interface
          const activeInterface = stats.network.interfaces.find(iface => 
            iface.operstate === 'up' && 
            iface.interfaceType && 
            iface.interfaceType.category !== 'loopback' &&
            iface.interfaceType.category !== 'virtual'
          );
          if (activeInterface) {
            primaryInterfaceType = activeInterface.interfaceType.type;
          }
        }
        
        networkType.textContent = primaryInterfaceType;
      }
      
      if (networkDetails && stats.network.totals) {
        const rx = stats.network.totals.rates.formatted.rx;
        const tx = stats.network.totals.rates.formatted.tx;
        networkDetails.textContent = `↓${rx.value}${rx.unit} ↑${tx.value}${tx.unit}`;
      }
      
      // Update mini chart
      const rxRate = stats.network.totals.rates.rx / 1024; // Convert to KB/s
      const txRate = stats.network.totals.rates.tx / 1024;
      this.chartManager.updateChart('network-mini-chart', rxRate);
    }

    // NPU Card
    if (stats.npu) {
      const npuStatus = document.getElementById('npu-status');
      const npuIndicator = document.getElementById('npu-indicator');
      const npuDetails = document.getElementById('npu-details');
      
      if (stats.npu.available && stats.npu.npus.length > 0) {
        const npu = stats.npu.npus[0];
        if (npuStatus) npuStatus.textContent = 'Active';
        if (npuIndicator) {
          npuIndicator.className = 'status-indicator active';
        }
        if (npuDetails) npuDetails.textContent = `${npu.vendor} ${npu.model}`;
      } else {
        if (npuStatus) npuStatus.textContent = 'N/A';
        if (npuIndicator) {
          npuIndicator.className = 'status-indicator inactive';
        }
        if (npuDetails) npuDetails.textContent = 'No NPU detected';
      }
    }

    // Motherboard Card
    if (stats.motherboard && !stats.motherboard.error) {
      const motherboardHealth = document.getElementById('motherboard-health');
      const motherboardBrand = document.getElementById('motherboard-brand');
      const motherboardModel = document.getElementById('motherboard-model');
      const biosVersion = document.getElementById('bios-version');
      const memorySlots = document.getElementById('memory-slots');
      
      if (motherboardHealth) {
        // Simple health indicator based on detection success
        const healthScore = stats.motherboard.motherboard.manufacturer !== 'Unknown' ? 'Good' : 'Unknown';
        motherboardHealth.textContent = healthScore;
      }
      
      if (motherboardBrand) {
        motherboardBrand.textContent = stats.motherboard.motherboard.manufacturer || 'Unknown';
      }
      
      if (motherboardModel) {
        motherboardModel.textContent = stats.motherboard.motherboard.model || 'Unknown Model';
      }
      
      if (biosVersion) {
        biosVersion.textContent = stats.motherboard.bios.version || 'Unknown';
      }
      
      if (memorySlots) {
        const occupied = stats.motherboard.memory.occupiedSlots || 0;
        const total = stats.motherboard.memory.totalSlots || 0;
        memorySlots.textContent = `${occupied}/${total}`;
      }
    } else if (stats.motherboard && stats.motherboard.error) {
      // Handle error state
      const motherboardHealth = document.getElementById('motherboard-health');
      const motherboardBrand = document.getElementById('motherboard-brand');
      const motherboardModel = document.getElementById('motherboard-model');
      
      if (motherboardHealth) motherboardHealth.textContent = 'Error';
      if (motherboardBrand) motherboardBrand.textContent = 'Detection Error';
      if (motherboardModel) motherboardModel.textContent = 'Unable to detect motherboard';
    }
  }

  updateDetailedSections(stats) {
    // Update detailed CPU section
    if (this.currentSection === 'cpu' && stats.cpu) {
      const cpuBrand = document.getElementById('cpu-brand');
      const cpuCores = document.getElementById('cpu-cores');
      const cpuSpeed = document.getElementById('cpu-speed');
      
      if (cpuBrand && stats.cpu.info) cpuBrand.textContent = stats.cpu.info.brand || 'Unknown';
      if (cpuCores && stats.cpu.info) {
        cpuCores.textContent = `${stats.cpu.info.cores} cores (${stats.cpu.info.physicalCores} physical)`;
      }
      if (cpuSpeed && stats.cpu.info) cpuSpeed.textContent = `${stats.cpu.info.speed} GHz`;
      
      // Update main chart
      this.chartManager.updateChart('cpu-main-chart', stats.cpu.usage);
    }

    // Update detailed memory section
    if (this.currentSection === 'memory' && stats.memory) {
      const memoryTotal = document.getElementById('memory-total');
      const memoryUsed = document.getElementById('memory-used');
      const memoryAvailable = document.getElementById('memory-available');
      
      if (memoryTotal && stats.memory.formatted) {
        memoryTotal.textContent = `${stats.memory.formatted.total.value} ${stats.memory.formatted.total.unit}`;
      }
      if (memoryUsed && stats.memory.formatted) {
        memoryUsed.textContent = `${stats.memory.formatted.used.value} ${stats.memory.formatted.used.unit}`;
      }
      if (memoryAvailable && stats.memory.formatted) {
        memoryAvailable.textContent = `${stats.memory.formatted.available.value} ${stats.memory.formatted.available.unit}`;
      }
      
      // Update main chart
      this.chartManager.updateChart('memory-main-chart', stats.memory.usagePercent);
    }

    // Update other detailed sections as needed...
    this.updateDetailedContent(stats);
  }

updateDetailedContent(stats) {
    // GPU Section
    if (this.currentSection === 'gpu') {
      const gpuContent = document.getElementById('gpu-content');
      if (gpuContent && stats.gpu) {
        if (stats.gpu.controllers.length > 0) {
          const gpu = stats.gpu.controllers[0];
          
          // Only create the HTML structure once
          if (!gpuContent.querySelector('.detail-grid')) {
            gpuContent.innerHTML = `
              <div class="detail-grid">
                <div class="chart-container">
                  <canvas id="gpu-main-chart"></canvas>
                </div>
                <div class="info-panel">
                  <div class="info-group">
                    <h4>GPU Information</h4>
                    <div class="info-item">
                      <span class="info-label">Name:</span>
                      <span class="info-value" id="gpu-info-name">${gpu.name || gpu.model || 'Unknown'}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Vendor:</span>
                      <span class="info-value" id="gpu-info-vendor">${gpu.vendor || 'Unknown'}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">VRAM:</span>
                      <span class="info-value" id="gpu-info-vram">Loading...</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Driver:</span>
                      <span class="info-value" id="gpu-info-driver">${gpu.driverVersion || 'Unknown'}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Utilization:</span>
                      <span class="info-value" id="gpu-info-util">Loading...</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Temperature:</span>
                      <span class="info-value" id="gpu-info-temp">Loading...</span>
                    </div>
                  </div>
                </div>
              </div>
            `;
            // Create chart after DOM is ready
            setTimeout(() => {
              this.chartManager.createGPUChart('gpu-main-chart', true);
            }, 100);
          }
          
          // Update the data
          const vramInfo = gpu.memory || gpu;
          const utilization = gpu.utilization || gpu.utilizationGpu || 0;
          const temperature = gpu.temperature || gpu.temperatureGpu || 0;
          
          document.getElementById('gpu-info-name').textContent = gpu.name || gpu.model || 'Unknown';
          document.getElementById('gpu-info-vendor').textContent = gpu.vendor || 'Unknown';
          document.getElementById('gpu-info-driver').textContent = gpu.driverVersion || 'Unknown';
          document.getElementById('gpu-info-util').textContent = `${utilization.toFixed(1)}%`;
          document.getElementById('gpu-info-temp').textContent = temperature > 0 ? `${temperature}°C` : 'N/A';
          
          if (vramInfo && vramInfo.total) {
            document.getElementById('gpu-info-vram').textContent = 
              `${this.chartManager.formatBytes(vramInfo.used)} / ${this.chartManager.formatBytes(vramInfo.total)}`;
          } else if (gpu.vram) {
            document.getElementById('gpu-info-vram').textContent = this.chartManager.formatBytes(gpu.vram * 1024 * 1024);
          } else {
            document.getElementById('gpu-info-vram').textContent = 'Unknown';
          }
          
          // Update chart
          this.chartManager.updateChart('gpu-main-chart', utilization);
          
        } else {
          gpuContent.innerHTML = '<div class="chart-no-data">No GPU detected</div>';
        }
      }
    }

    // NPU Section
    if (this.currentSection === 'npu') {
      const npuContent = document.getElementById('npu-content');
      if (npuContent && stats.npu) {
        if (stats.npu.available && stats.npu.npus.length > 0) {
          const npu = stats.npu.npus[0];
          npuContent.innerHTML = `
            <div class="info-panel">
              <div class="info-group">
                <h4>NPU Information</h4>
                <div class="info-item">
                  <span class="info-label">Vendor:</span>
                  <span class="info-value">${npu.vendor}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Model:</span>
                  <span class="info-value">${npu.model}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Type:</span>
                  <span class="info-value">${npu.type}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status:</span>
                  <span class="info-value">Active</span>
                </div>
              </div>
            </div>
          `;
        } else {
          npuContent.innerHTML = '<div class="chart-no-data">No NPU detected on this system</div>';
        }
      }
    }

// Storage Section
    if (this.currentSection === 'storage') {
      const storageContent = document.getElementById('storage-content');
      
      if (storageContent) {
        if (!stats.storage || !stats.storage.filesystem || stats.storage.filesystem.length === 0) {
          // Show loading or no data message
          const hasStorageData = stats.storage ? 'No storage devices detected' : 'Loading storage information...';
          storageContent.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 300px; color: var(--text-muted); font-style: italic;">
              ${hasStorageData}<br><small>Checking filesystem and disk data</small>
            </div>
          `;
          return;
        }
        
        // Create the HTML structure if it doesn't exist, or update drives if needed
        const storageOverview = storageContent.querySelector('.storage-overview');
        const needsInitialSetup = !storageOverview;
        const needsDriveUpdate = storageOverview && !storageOverview.querySelector('.drive-item');
        
        if (needsInitialSetup) {
          let html = '<div class="storage-overview">';
          
          // Calculate total storage statistics for overview
          let totalSize = 0;
          let totalUsed = 0;
          let totalAvailable = 0;
          
          (stats.storage.filesystem || []).forEach(fs => {
            totalSize += fs.size || 0;
            totalUsed += fs.used || 0;
            totalAvailable += fs.available || 0;
          });
          
          const totalUsagePercent = totalSize > 0 ? (totalUsed / totalSize) * 100 : 0;
          const formattedTotalUsed = this.chartManager.formatBytes(totalUsed);
          const formattedTotalSize = this.chartManager.formatBytes(totalSize);
          const formattedTotalAvailable = this.chartManager.formatBytes(totalAvailable);
          
          // Add Storage Overview section
          html += `
            <div class="detail-grid">
              <div class="chart-container">
                <h4>Storage I/O Performance</h4>
                <canvas id="storage-main-chart"></canvas>
              </div>
              <div class="info-panel">
                <div class="info-group">
                  <h4>Total Storage Usage</h4>
                  <div class="info-item">
                    <span class="info-label">Total Capacity:</span>
                    <span class="info-value">${formattedTotalSize}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Used Space:</span>
                    <span class="info-value">${formattedTotalUsed}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Available Space:</span>
                    <span class="info-value">${formattedTotalAvailable}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Usage Percentage:</span>
                    <span class="info-value">${totalUsagePercent.toFixed(1)}%</span>
                  </div>
                </div>
                
                <div class="info-group">
                  <h4>I/O Performance</h4>
                  <div class="info-item">
                    <span class="info-label">Read Rate:</span>
                    <span class="info-value" id="storage-read-rate">0 B/s</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Write Rate:</span>
                    <span class="info-value" id="storage-write-rate">0 B/s</span>
                  </div>
                </div>
              </div>
            </div>
          `;
          
          // Individual Drive Details
          if (stats.storage.filesystem && stats.storage.filesystem.length > 0) {
            html += '<div class="info-group drive-details"><h4>Individual Drives</h4>';
            stats.storage.filesystem.forEach((fs, index) => {
              // Determine drive type indicator
              const driveType = this.getDriveTypeInfo(fs.fs, fs.type);
              const driveClass = driveType.name.toLowerCase().replace(' ', '-');
              const driveId = `drive-${fs.fs.replace(':', '').replace('/', '-')}`;
              
              html += `
                <div class="storage-item drive-item ${driveClass}" id="${driveId}">
                  <div class="storage-header">
                    <div class="drive-info">
                      <span class="drive-icon" title="${driveType.description}">${driveType.icon}</span>
                      <div class="drive-names">
                        <span class="fs-name">${fs.fs}</span>
                        <span class="drive-type">${driveType.name}</span>
                      </div>
                    </div>
                    <span class="fs-usage" id="${driveId}-usage">${fs.usagePercent.toFixed(1)}%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" id="${driveId}-progress" style="width: ${Math.min(fs.usagePercent, 100)}%"></div>
                  </div>
                  <div class="fs-details">
                    <div class="fs-detail-grid">
                      <div class="detail-item">
                        <span class="detail-label">Used:</span>
                        <span class="detail-value" id="${driveId}-used">${fs.formatted.used.value} ${fs.formatted.used.unit}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Available:</span>
                        <span class="detail-value" id="${driveId}-available">${fs.formatted.available.value} ${fs.formatted.available.unit}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Total:</span>
                        <span class="detail-value" id="${driveId}-total">${fs.formatted.size.value} ${fs.formatted.size.unit}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">File System:</span>
                        <span class="detail-value" id="${driveId}-type">${fs.type || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            });
            html += '</div>';
          }

          html += '</div>';
          storageContent.innerHTML = html;
          
          // Create I/O chart
          setTimeout(() => {
            this.createStorageChart();
          }, 100);
        } else if (needsDriveUpdate) {
          // Update only the individual drives section if it's missing
          const driveDetailsSection = storageOverview.querySelector('.drive-details');
          if (driveDetailsSection && stats.storage.filesystem && stats.storage.filesystem.length > 0) {
            let driveHtml = '<h4>Individual Drives</h4>';
            stats.storage.filesystem.forEach((fs, index) => {
              // Determine drive type indicator
              const driveType = this.getDriveTypeInfo(fs.fs, fs.type);
              const driveClass = driveType.name.toLowerCase().replace(' ', '-');
              const driveId = `drive-${fs.fs.replace(':', '').replace('/', '-')}`;
              
              driveHtml += `
                <div class="storage-item drive-item ${driveClass}" id="${driveId}">
                  <div class="storage-header">
                    <div class="drive-info">
                      <span class="drive-icon" title="${driveType.description}">${driveType.icon}</span>
                      <div class="drive-names">
                        <span class="fs-name">${fs.fs}</span>
                        <span class="drive-type">${driveType.name}</span>
                      </div>
                    </div>
                    <span class="fs-usage" id="${driveId}-usage">${fs.usagePercent.toFixed(1)}%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" id="${driveId}-progress" style="width: ${Math.min(fs.usagePercent, 100)}%"></div>
                  </div>
                  <div class="fs-details">
                    <div class="fs-detail-grid">
                      <div class="detail-item">
                        <span class="detail-label">Used:</span>
                        <span class="detail-value" id="${driveId}-used">${fs.formatted.used.value} ${fs.formatted.used.unit}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Available:</span>
                        <span class="detail-value" id="${driveId}-available">${fs.formatted.available.value} ${fs.formatted.available.unit}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Total:</span>
                        <span class="detail-value" id="${driveId}-total">${fs.formatted.size.value} ${fs.formatted.size.unit}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">File System:</span>
                        <span class="detail-value" id="${driveId}-type">${fs.type || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            });
            driveDetailsSection.innerHTML = driveHtml;
          }
        }
        
        // Update total storage usage in the overview panel
        if (stats.storage.filesystem.length > 0) {
          let totalSize = 0;
          let totalUsed = 0;
          let totalAvailable = 0;
          
          (stats.storage.filesystem || []).forEach(fs => {
            totalSize += fs.size || 0;
            totalUsed += fs.used || 0;
            totalAvailable += fs.available || 0;
          });
          
          const totalUsagePercent = totalSize > 0 ? (totalUsed / totalSize) * 100 : 0;
          const formattedTotalUsed = this.chartManager.formatBytes(totalUsed);
          const formattedTotalSize = this.chartManager.formatBytes(totalSize);
          const formattedTotalAvailable = this.chartManager.formatBytes(totalAvailable);
          
          // Update total storage overview elements if they exist
          const totalCapacityEl = document.querySelector('.storage-overview .info-group:first-child .info-item:nth-child(1) .info-value');
          const usedSpaceEl = document.querySelector('.storage-overview .info-group:first-child .info-item:nth-child(2) .info-value');
          const availableSpaceEl = document.querySelector('.storage-overview .info-group:first-child .info-item:nth-child(3) .info-value');
          const usagePercentEl = document.querySelector('.storage-overview .info-group:first-child .info-item:nth-child(4) .info-value');
          
          if (totalCapacityEl) totalCapacityEl.textContent = formattedTotalSize;
          if (usedSpaceEl) usedSpaceEl.textContent = formattedTotalUsed;
          if (availableSpaceEl) availableSpaceEl.textContent = formattedTotalAvailable;
          if (usagePercentEl) usagePercentEl.textContent = `${totalUsagePercent.toFixed(1)}%`;
        }
        
        
        // Update I/O rates
        if (stats.storage.io && stats.storage.io.rates) {
          const readRate = stats.storage.io.rates.read || 0;
          const writeRate = stats.storage.io.rates.write || 0;
          
          const readRateEl = document.getElementById('storage-read-rate');
          const writeRateEl = document.getElementById('storage-write-rate');
          
          if (readRateEl) readRateEl.textContent = window.utils.formatBytesPerSecond(readRate);
          if (writeRateEl) writeRateEl.textContent = window.utils.formatBytesPerSecond(writeRate);
          
          // Update chart
          this.chartManager.updateChart('storage-main-chart', [readRate / 1024 / 1024, writeRate / 1024 / 1024]); // Convert to MB/s
        }
      }
    }

// Motherboard Section
    if (this.currentSection === 'motherboard') {
      this.updateMotherboardDetailedContent(stats);
    }

    // Network Section
    if (this.currentSection === 'network') {
      const networkContent = document.getElementById('network-content');
      if (networkContent && stats.network) {
        
        // Only create the HTML structure once
        if (!networkContent.querySelector('.network-overview')) {
          let html = '<div class="network-overview">';
          
          // Add Network Chart section
          html += `
            <div class="detail-grid">
              <div class="chart-container">
                <h4>Network Traffic</h4>
                <canvas id="network-main-chart"></canvas>
              </div>
              <div class="info-panel">
                <div class="info-group">
                  <h4>Connection Information</h4>
                  <div class="info-item">
                    <span class="info-label">Connection Type:</span>
                    <span class="info-value" id="network-connection-type">Unknown</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Primary Interface:</span>
                    <span class="info-value" id="network-primary-interface">N/A</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Connection Status:</span>
                    <span class="info-value" id="network-connection-status">Unknown</span>
                  </div>
                </div>
                
                <div class="info-group">
                  <h4>Traffic Statistics</h4>
                  <div class="info-item">
                    <span class="info-label">Download:</span>
                    <span class="info-value" id="network-download-rate">0 B/s</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Upload:</span>
                    <span class="info-value" id="network-upload-rate">0 B/s</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Active Connections:</span>
                    <span class="info-value" id="network-active-connections">0</span>
                  </div>
                </div>
                
                <div class="info-group">
                  <h4>Network Addressing</h4>
                  <div class="info-item">
                    <span class="info-label">Local IP:</span>
                    <span class="info-value" id="network-local-ip">N/A</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Gateway:</span>
                    <span class="info-value" id="network-gateway">N/A</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">DNS Servers:</span>
                    <span class="info-value" id="network-dns">N/A</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Subnet Mask:</span>
                    <span class="info-value" id="network-subnet">N/A</span>
                  </div>
                </div>
              </div>
            </div>
          `;
          
          // Network interfaces
          if (stats.network.interfaces.length > 0) {
            html += '<div class="info-group"><h4>Network Interfaces</h4>';
            stats.network.interfaces.forEach(iface => {
              // Show interface if it has no info (null) or if it has info and is not internal
              if (!iface.info || (iface.info && !iface.info.internal)) {
                const typeIcon = iface.interfaceType?.icon || '❓';
                const typeDescription = iface.interfaceType?.description || 'Unknown interface';
                const manufacturer = iface.manufacturer || 'Unknown';
                const isDefault = iface.isDefault ? ' (Default)' : '';
                
                html += `
                  <div class="network-item ${iface.interfaceType?.category || 'unknown'}">
                    <div class="network-header">
                      <div class="interface-info">
                        <span class="interface-icon" title="${typeDescription}">${typeIcon}</span>
                        <div class="interface-names">
                          <span class="iface-name">${iface.iface}${isDefault}</span>
                          <span class="interface-type">${iface.interfaceType?.type || 'Unknown'}</span>
                        </div>
                      </div>
                      <span class="iface-status ${iface.operstate === 'up' ? 'active' : 'inactive'}">${iface.operstate}</span>
                    </div>
                    <div class="network-details">
                      <div class="detail-row">
                        <span class="detail-label">IP Address:</span>
                        <span class="detail-value">${iface.info?.ip4 || 'N/A'}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">MAC Address:</span>
                        <span class="detail-value">${iface.info?.mac || 'N/A'}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">Manufacturer:</span>
                        <span class="detail-value manufacturer">${manufacturer}</span>
                      </div>
                      <div class="detail-row">
                        <span class="detail-label">Link Speed:</span>
                        <span class="detail-value">${iface.info?.speed ? iface.info.speed + ' Mbps' : 'N/A'}</span>
                      </div>
                      ${iface.info?.mtu ? `
                        <div class="detail-row">
                          <span class="detail-label">MTU:</span>
                          <span class="detail-value">${iface.info.mtu}</span>
                        </div>
                      ` : ''}
                    </div>
                    <div class="network-stats" id="iface-${iface.iface}-stats">
                      <div class="stat-item">
                        <span class="stat-icon">↓</span>
                        <span class="stat-value">${iface.rates?.formatted?.rx?.value || '0'} ${iface.rates?.formatted?.rx?.unit || 'B/s'}</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-icon">↑</span>
                        <span class="stat-value">${iface.rates?.formatted?.tx?.value || '0'} ${iface.rates?.formatted?.tx?.unit || 'B/s'}</span>
                      </div>
                    </div>
                  </div>
                `;
              }
            });
            html += '</div>';
          }

          html += '</div>';
          networkContent.innerHTML = html;
          
          // Create network chart
          setTimeout(() => {
            this.chartManager.createNetworkChart('network-main-chart', true);
          }, 100);
        }
        
        // Update network data
        if (stats.network.totals && stats.network.totals.rates) {
          const rxRate = stats.network.totals.rates.rx || 0;
          const txRate = stats.network.totals.rates.tx || 0;
          
          const downloadRateEl = document.getElementById('network-download-rate');
          const uploadRateEl = document.getElementById('network-upload-rate');
          
          if (downloadRateEl) downloadRateEl.textContent = window.utils.formatBytesPerSecond(rxRate);
          if (uploadRateEl) uploadRateEl.textContent = window.utils.formatBytesPerSecond(txRate);
          document.getElementById('network-active-connections').textContent = stats.network.connections.active || 0;
          
          // Update chart (convert to KB/s)
          this.chartManager.updateChart('network-main-chart', [rxRate / 1024, txRate / 1024]);
        }
        
        // Update connection information
        this.updateConnectionInfo(stats.network);
        
        // Update network addressing information
        if (stats.network.addressing) {
          const addressing = stats.network.addressing;
          document.getElementById('network-local-ip').textContent = addressing.localIP || 'N/A';
          document.getElementById('network-gateway').textContent = addressing.gateway || 'N/A';
          document.getElementById('network-dns').textContent = addressing.dns || 'N/A';
          document.getElementById('network-subnet').textContent = addressing.subnet || 'N/A';
        }
        
        // Update individual interface stats
        stats.network.interfaces.forEach(iface => {
          if ((!iface.info || (iface.info && !iface.info.internal)) && iface.rates) {
            const statsElement = document.getElementById(`iface-${iface.iface}-stats`);
            if (statsElement) {
              statsElement.innerHTML = `
                <div class="stat-item">
                  <span class="stat-icon">↓</span>
                  <span class="stat-value">${iface.rates.formatted?.rx?.value || '0'} ${iface.rates.formatted?.rx?.unit || 'B/s'}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">↑</span>
                  <span class="stat-value">${iface.rates.formatted?.tx?.value || '0'} ${iface.rates.formatted?.tx?.unit || 'B/s'}</span>
                </div>
              `;
            }
          }
        });
      }
    }
  }

  updateLastUpdatedTime() {
    const element = document.getElementById('last-updated-time');
    if (element) {
      const now = new Date();
      element.textContent = now.toLocaleTimeString();
    }
  }

  toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('.icon-theme');
    
    if (body.classList.contains('theme-dark')) {
      body.classList.remove('theme-dark');
      body.classList.add('theme-light');
      if (themeIcon) themeIcon.textContent = '☀️';
      localStorage.setItem('pmon-theme', 'light');
    } else {
      body.classList.remove('theme-light');
      body.classList.add('theme-dark');
      if (themeIcon) themeIcon.textContent = '🌙';
      localStorage.setItem('pmon-theme', 'dark');
    }
    
    // Update charts with new theme
    this.chartManager.updateTheme();
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('pmon-theme');
    const body = document.body;
    const themeIcon = document.querySelector('.icon-theme');
    
    if (savedTheme === 'light') {
      body.classList.remove('theme-dark');
      body.classList.add('theme-light');
      if (themeIcon) themeIcon.textContent = '☀️';
    } else {
      body.classList.remove('theme-light');
      body.classList.add('theme-dark');
      if (themeIcon) themeIcon.textContent = '🌙';
    }
  }

onThemeChanged() {
    // Reinitialize all charts with new theme
    setTimeout(() => {
      this.initializeCharts();
      this.initializeSectionCharts(this.currentSection);
    }, 100);
  }
  
  createStorageChart() {
    if (!this.chartManager.charts.has('storage-main-chart')) {
      const canvas = document.getElementById('storage-main-chart');
      if (canvas) {
        const config = this.chartManager.createBaseConfig('line');
        
        config.data.datasets = [
          {
            label: 'Read (MB/s)',
            data: [],
            borderColor: '#2196f3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3
          },
          {
            label: 'Write (MB/s)',
            data: [],
            borderColor: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3
          }
        ];
        
        config.options.scales.y.ticks.callback = (value) => {
          return value.toFixed(1) + ' MB/s';
        };
        
        const chart = new Chart(canvas, config);
        this.chartManager.charts.set('storage-main-chart', chart);
      }
    }
  }

  ensureGPUContent() {
    const gpuContent = document.getElementById('gpu-content');
    if (gpuContent && !gpuContent.querySelector('.detail-grid')) {
      gpuContent.innerHTML = `
        <div class="detail-grid">
          <div class="chart-container">
            <canvas id="gpu-main-chart"></canvas>
          </div>
          <div class="info-panel">
            <div class="info-group">
              <h4>GPU Information</h4>
              <div class="info-item">
                <span class="info-label">Name:</span>
                <span class="info-value" id="gpu-info-name">Loading...</span>
              </div>
              <div class="info-item">
                <span class="info-label">Vendor:</span>
                <span class="info-value" id="gpu-info-vendor">Loading...</span>
              </div>
              <div class="info-item">
                <span class="info-label">VRAM:</span>
                <span class="info-value" id="gpu-info-vram">Loading...</span>
              </div>
              <div class="info-item">
                <span class="info-label">Driver:</span>
                <span class="info-value" id="gpu-info-driver">Loading...</span>
              </div>
              <div class="info-item">
                <span class="info-label">Utilization:</span>
                <span class="info-value" id="gpu-info-util">Loading...</span>
              </div>
              <div class="info-item">
                <span class="info-label">Temperature:</span>
                <span class="info-value" id="gpu-info-temp">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Create chart after a short delay
      setTimeout(() => {
        this.chartManager.createGPUChart('gpu-main-chart', true);
      }, 100);
    }
  }

  ensureStorageContent() {
    const storageContent = document.getElementById('storage-content');
    if (storageContent && !storageContent.querySelector('.storage-overview')) {
      storageContent.innerHTML = `
        <div class="storage-overview">
          <div class="detail-grid">
            <div class="chart-container">
              <h4>Storage I/O Performance</h4>
              <canvas id="storage-main-chart"></canvas>
            </div>
            <div class="info-panel">
              <div class="info-group">
                <h4>Total Storage Usage</h4>
                <div class="info-item">
                  <span class="info-label">Total Capacity:</span>
                  <span class="info-value">Loading...</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Used Space:</span>
                  <span class="info-value">Loading...</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Available Space:</span>
                  <span class="info-value">Loading...</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Usage Percentage:</span>
                  <span class="info-value">Loading...</span>
                </div>
              </div>
              
              <div class="info-group">
                <h4>I/O Performance</h4>
                <div class="info-item">
                  <span class="info-label">Read Rate:</span>
                  <span class="info-value" id="storage-read-rate">0 B/s</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Write Rate:</span>
                  <span class="info-value" id="storage-write-rate">0 B/s</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="info-group drive-details">
            <h4>Individual Drives</h4>
            <p>Drive information will appear when navigating to the Storage section.</p>
          </div>
        </div>
      `;
      
      // Create chart after a short delay
      setTimeout(() => {
        this.createStorageChart();
      }, 100);
    }
  }

  ensureNetworkContent() {
    const networkContent = document.getElementById('network-content');
    if (networkContent && !networkContent.querySelector('.network-overview')) {
      networkContent.innerHTML = `
        <div class="network-overview">
          <div class="detail-grid">
            <div class="chart-container">
              <h4>Network Traffic</h4>
              <canvas id="network-main-chart"></canvas>
            </div>
            <div class="info-panel">
              <div class="info-group">
                <h4>Connection Information</h4>
                <div class="info-item">
                  <span class="info-label">Connection Type:</span>
                  <span class="info-value" id="network-connection-type">Unknown</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Primary Interface:</span>
                  <span class="info-value" id="network-primary-interface">N/A</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Connection Status:</span>
                  <span class="info-value" id="network-connection-status">Unknown</span>
                </div>
              </div>
              
              <div class="info-group">
                <h4>Traffic Statistics</h4>
                <div class="info-item">
                  <span class="info-label">Download:</span>
                  <span class="info-value" id="network-download-rate">0 B/s</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Upload:</span>
                  <span class="info-value" id="network-upload-rate">0 B/s</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Active Connections:</span>
                  <span class="info-value" id="network-active-connections">0</span>
                </div>
              </div>
              
              <div class="info-group">
                <h4>Network Addressing</h4>
                <div class="info-item">
                  <span class="info-label">Local IP:</span>
                  <span class="info-value" id="network-local-ip">N/A</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Gateway:</span>
                  <span class="info-value" id="network-gateway">N/A</span>
                </div>
                <div class="info-item">
                  <span class="info-label">DNS Servers:</span>
                  <span class="info-value" id="network-dns">N/A</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Subnet Mask:</span>
                  <span class="info-value" id="network-subnet">N/A</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Create chart after a short delay
      setTimeout(() => {
        this.chartManager.createNetworkChart('network-main-chart', true);
      }, 100);
    }
  }

  ensureSectionContent(sectionName) {
    switch (sectionName) {
      case 'gpu':
        this.ensureGPUContent();
        break;
      case 'storage':
        this.ensureStorageContent();
        break;
      case 'network':
        this.ensureNetworkContent();
        break;
      case 'npu':
        this.ensureNPUContent();
        break;
      case 'motherboard':
        this.ensureMotherboardContent();
        break;
    }
  }

  ensureNPUContent() {
    const npuContent = document.getElementById('npu-content');
    if (npuContent) {
      npuContent.innerHTML = `
        <div class="info-panel">
          <div class="info-group">
            <h4>NPU Information</h4>
            <div class="info-item">
              <span class="info-label">Status:</span>
              <span class="info-value" id="npu-detail-status">Checking...</span>
            </div>
            <div class="info-item">
              <span class="info-label">Vendor:</span>
              <span class="info-value" id="npu-detail-vendor">Unknown</span>
            </div>
            <div class="info-item">
              <span class="info-label">Model:</span>
              <span class="info-value" id="npu-detail-model">Unknown</span>
            </div>
          </div>
        </div>
      `;
    }
  }

  ensureMotherboardContent() {
    const motherboardContent = document.getElementById('motherboard-content');
    if (motherboardContent && !motherboardContent.querySelector('.motherboard-overview')) {
      motherboardContent.innerHTML = `
        <div class="motherboard-overview">
          <div class="detail-grid">
            <div class="chart-container">
              <h4>System Health Overview</h4>
              <div class="health-indicators">
                <div class="health-item">
                  <span class="health-label">Overall Health:</span>
                  <span class="health-value" id="motherboard-health-score">Checking...</span>
                </div>
                <div class="health-item">
                  <span class="health-label">BIOS Age:</span>
                  <span class="health-value" id="bios-age">--</span>
                </div>
                <div class="health-item">
                  <span class="health-label">Memory Utilization:</span>
                  <span class="health-value" id="memory-utilization">--%</span>
                </div>
              </div>
            </div>
            <div class="info-panel">
              <div class="info-group">
                <h4>Motherboard Information</h4>
                <div class="info-item">
                  <span class="info-label">Manufacturer:</span>
                  <span class="info-value" id="mb-manufacturer">Loading...</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Model:</span>
                  <span class="info-value" id="mb-model">Loading...</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Version:</span>
                  <span class="info-value" id="mb-version">Loading...</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Serial Number:</span>
                  <span class="info-value" id="mb-serial">Loading...</span>
                </div>
              </div>
              
              <div class="info-group">
                <h4>BIOS/UEFI Information</h4>
                <div class="info-item">
                  <span class="info-label">Vendor:</span>
                  <span class="info-value" id="bios-vendor">Loading...</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Version:</span>
                  <span class="info-value" id="bios-detail-version">Loading...</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Release Date:</span>
                  <span class="info-value" id="bios-date">Loading...</span>
                </div>
              </div>
              
              <div class="info-group">
                <h4>System Information</h4>
                <div class="info-item">
                  <span class="info-label">Manufacturer:</span>
                  <span class="info-value" id="system-manufacturer">Loading...</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Model:</span>
                  <span class="info-value" id="system-model">Loading...</span>
                </div>
                <div class="info-item">
                  <span class="info-label">UUID:</span>
                  <span class="info-value" id="system-uuid">Loading...</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="memory-layout" id="memory-layout">
            <h4>Memory Configuration</h4>
            <div class="memory-slots" id="memory-slots-detail">
              Loading memory layout...
            </div>
          </div>
          
          <div class="expansion-slots" id="expansion-slots">
            <h4>Expansion Cards & Devices</h4>
            <div class="expansion-content" id="expansion-content">
              Loading expansion information...
            </div>
          </div>
        </div>
      `;
    }
  }

  updateMotherboardDetailedContent(stats) {
    if (!stats.motherboard || stats.motherboard.error) {
      const motherboardContent = document.getElementById('motherboard-content');
      if (motherboardContent) {
        motherboardContent.innerHTML = `
          <div class="chart-no-data">
            <p>Motherboard information unavailable</p>
            <small>Unable to retrieve motherboard details from this system</small>
          </div>
        `;
      }
      return;
    }

    const mb = stats.motherboard;
    
    // Update health indicators
    document.getElementById('motherboard-health-score').textContent = 
      mb.motherboard.manufacturer !== 'Unknown' ? 'Good' : 'Limited Detection';
    
    if (mb.stats.biosAge) {
      const years = Math.floor(mb.stats.biosAge / 365);
      const days = mb.stats.biosAge % 365;
      document.getElementById('bios-age').textContent = 
        `${years > 0 ? years + 'y ' : ''}${days}d`;
    } else {
      document.getElementById('bios-age').textContent = 'Unknown';
    }
    
    document.getElementById('memory-utilization').textContent = 
      `${mb.stats.memoryUtilization.toFixed(1)}%`;

    // Update motherboard info
    document.getElementById('mb-manufacturer').textContent = mb.motherboard.manufacturer;
    document.getElementById('mb-model').textContent = mb.motherboard.model;
    document.getElementById('mb-version').textContent = mb.motherboard.version;
    document.getElementById('mb-serial').textContent = 
      mb.motherboard.serialNumber !== 'Not Available' ? mb.motherboard.serialNumber : 'Not Available';

    // Update BIOS info
    document.getElementById('bios-vendor').textContent = mb.bios.vendor;
    document.getElementById('bios-detail-version').textContent = mb.bios.version;
    document.getElementById('bios-date').textContent = mb.bios.releaseDate;

    // Update system info
    document.getElementById('system-manufacturer').textContent = mb.system.manufacturer;
    document.getElementById('system-model').textContent = mb.system.model;
    
    // Handle UUID with proper truncation
    const uuidElement = document.getElementById('system-uuid');
    if (mb.system.uuid !== 'Not Available' && mb.system.uuid.length > 20) {
      uuidElement.textContent = mb.system.uuid.substring(0, 20) + '...';
      uuidElement.title = mb.system.uuid; // Full UUID in tooltip
    } else {
      uuidElement.textContent = mb.system.uuid;
    }

    // Update memory layout
    this.updateMemoryLayout(mb.memory);
    
    // Update expansion slots
    this.updateExpansionSlots(mb.expansionSlots, mb.usb);
  }

  updateMemoryLayout(memoryInfo) {
    const memorySlotDetail = document.getElementById('memory-slots-detail');
    if (!memorySlotDetail) return;

    if (memoryInfo.slots.length === 0) {
      memorySlotDetail.innerHTML = '<p>No memory slot information available</p>';
      return;
    }

    let slotsHtml = '<div class="memory-slots-grid">';
    memoryInfo.slots.forEach((slot, index) => {
      const isEmpty = slot.size === 0;
      const formattedSize = isEmpty ? 'Empty' : this.formatBytes(slot.size);
      
      const deviceName = slot.deviceLocator || `Slot ${index + 1}`;
      const truncatedName = deviceName.length > 15 ? deviceName.substring(0, 15) + '...' : deviceName;
      
      slotsHtml += `
        <div class="memory-slot ${isEmpty ? 'empty' : 'occupied'}">
          <div class="slot-header">
            <span class="slot-name" title="${deviceName}">${truncatedName}</span>
            <span class="slot-size">${formattedSize.value || formattedSize} ${formattedSize.unit || ''}</span>
          </div>
          ${!isEmpty ? `
            <div class="slot-details">
              <div>Type: ${slot.type}</div>
              <div>Speed: ${slot.clockConfigured || 'Unknown'} MHz</div>
              <div>Mfg: ${slot.manufacturer.length > 12 ? slot.manufacturer.substring(0, 12) + '...' : slot.manufacturer}</div>
            </div>
          ` : ''}
        </div>
      `;
    });
    slotsHtml += '</div>';
    
    memorySlotDetail.innerHTML = slotsHtml;
  }

  updateExpansionSlots(expansionSlots, usb) {
    const expansionContent = document.getElementById('expansion-content');
    if (!expansionContent) return;

    let html = '';
    
    // Graphics cards
    if (expansionSlots.graphics.length > 0) {
      html += '<div class="expansion-category"><h5>Graphics Cards</h5>';
      expansionSlots.graphics.forEach(gpu => {
        html += `
          <div class="expansion-item">
            <span class="item-name">${gpu.model}</span>
            <span class="item-details">${gpu.vendor} | ${gpu.bus}</span>
          </div>
        `;
      });
      html += '</div>';
    }

    // Audio devices
    if (expansionSlots.audio.length > 0) {
      html += '<div class="expansion-category"><h5>Audio Devices</h5>';
      expansionSlots.audio.forEach(audio => {
        html += `
          <div class="expansion-item">
            <span class="item-name">${audio.name}</span>
            <span class="item-details">${audio.manufacturer}</span>
          </div>
        `;
      });
      html += '</div>';
    }

    // Network interfaces
    if (expansionSlots.network.length > 0) {
      html += '<div class="expansion-category"><h5>Network Interfaces</h5>';
      expansionSlots.network.forEach(net => {
        html += `
          <div class="expansion-item">
            <span class="item-name">${net.name}</span>
            <span class="item-details">${net.type} | ${net.speed || 'Unknown speed'}</span>
          </div>
        `;
      });
      html += '</div>';
    }

    // USB devices (show only a few key ones)
    if (usb.devices.length > 0) {
      html += '<div class="expansion-category"><h5>USB Devices</h5>';
      const keyDevices = usb.devices.slice(0, 5); // Show first 5
      keyDevices.forEach(device => {
        html += `
          <div class="expansion-item">
            <span class="item-name">${device.name}</span>
            <span class="item-details">${device.vendor}</span>
          </div>
        `;
      });
      if (usb.devices.length > 5) {
        html += `<div class="expansion-item"><span class="item-name">... and ${usb.devices.length - 5} more devices</span></div>`;
      }
      html += '</div>';
    }

    expansionContent.innerHTML = html || '<p>No expansion information available</p>';
  }

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

  getDriveTypeInfo(driveLetter, fileSystem) {
    // Determine drive type based on drive letter and filesystem
    const drive = driveLetter.toUpperCase();
    
    // System/Boot drives
    if (drive === 'C:' || drive === '/') {
      return {
        icon: '💿',
        name: 'System Drive',
        description: 'Primary system/boot drive'
      };
    }
    
    // Network drives
    if (drive.startsWith('\\\\') || fileSystem === 'cifs' || fileSystem === 'nfs') {
      return {
        icon: '🌐',
        name: 'Network Drive',
        description: 'Network attached storage'
      };
    }
    
    // Optical/CD drives
    if (fileSystem === 'iso9660' || fileSystem === 'udf') {
      return {
        icon: '📍',
        name: 'Optical Drive',
        description: 'CD/DVD/Blu-ray drive'
      };
    }
    
    // USB/External drives (common drive letters)
    if (['D:', 'E:', 'F:', 'G:', 'H:', 'I:', 'J:', 'K:'].includes(drive) && fileSystem !== 'NTFS') {
      return {
        icon: '💾',
        name: 'Removable Drive',
        description: 'USB or external drive'
      };
    }
    
    // SSD indicators (modern file systems)
    if (fileSystem === 'ext4' || fileSystem === 'btrfs' || fileSystem === 'zfs') {
      return {
        icon: '⚡',
        name: 'Storage Drive',
        description: 'High-performance storage'
      };
    }
    
    // Default hard drive
    return {
      icon: '💾',
      name: 'Storage Drive',
      description: 'Local storage drive'
    };
  }

  updateConnectionInfo(networkStats) {
    // Only update if we're in the network section to avoid unnecessary DOM operations
    if (this.currentSection !== 'network') return;
    if (!networkStats || !networkStats.interfaces || networkStats.interfaces.length === 0) return;
    
    try {
      // Find the primary interface (default or first active)
      const defaultInterface = networkStats.interfaces.find(iface => iface.isDefault);
      const activeInterface = networkStats.interfaces.find(iface => 
        iface.operstate === 'up' && 
        iface.interfaceType && 
        iface.interfaceType.category !== 'loopback' &&
        iface.interfaceType.category !== 'virtual'
      );
      
      const primaryInterface = defaultInterface || activeInterface || networkStats.interfaces[0];
      
      if (primaryInterface) {
        // Update Connection Type
        const connectionTypeElement = document.getElementById('network-connection-type');
        if (connectionTypeElement) {
          const connectionType = this.getConnectionDisplayName(primaryInterface.interfaceType);
          if (connectionTypeElement.textContent !== connectionType) {
            connectionTypeElement.textContent = connectionType;
            connectionTypeElement.className = 'info-value connection-type ' + (primaryInterface.interfaceType?.category || 'unknown');
          }
        }
        
        // Update Primary Interface
        const primaryInterfaceElement = document.getElementById('network-primary-interface');
        if (primaryInterfaceElement) {
          const interfaceName = primaryInterface.iface + (primaryInterface.isDefault ? ' (Default)' : '');
          if (primaryInterfaceElement.textContent !== interfaceName) {
            primaryInterfaceElement.textContent = interfaceName;
          }
        }
        
        // Update Connection Status
        const connectionStatusElement = document.getElementById('network-connection-status');
        if (connectionStatusElement) {
          const status = this.getConnectionStatus(primaryInterface);
          if (connectionStatusElement.textContent !== status.text) {
            connectionStatusElement.textContent = status.text;
            connectionStatusElement.className = 'info-value connection-status ' + status.class;
          }
        }
      }
    } catch (error) {
      console.warn('Error updating connection info:', error);
    }
  }
  
  getConnectionDisplayName(interfaceType) {
    if (!interfaceType) return 'Unknown';
    
    switch (interfaceType.category) {
      case 'ethernet':
        return '🌐 Ethernet Connection';
      case 'wifi':
        return '📶 Wireless Connection';
      case 'bluetooth':
        return '🔵 Bluetooth Connection';
      case 'cellular':
        return '📱 Mobile Connection';
      case 'vpn':
        return '🛡️ VPN Connection';
      case 'virtual':
        return '🔗 Virtual Connection';
      case 'loopback':
        return '🔄 Loopback Connection';
      default:
        return interfaceType.type + ' Connection';
    }
  }
  
  getConnectionStatus(networkInterface) {
    const operstate = networkInterface.operstate?.toLowerCase();
    
    switch (operstate) {
      case 'up':
        return { text: 'Connected', class: 'connected' };
      case 'down':
        return { text: 'Disconnected', class: 'disconnected' };
      case 'dormant':
        return { text: 'Standby', class: 'standby' };
      case 'unknown':
      default:
        return { text: 'Status Unknown', class: 'unknown' };
    }
  }

  

  showLoadingContent(sectionName) {
    const sectionContent = document.querySelector(`#${sectionName}-content`);
    if (sectionContent) {
      sectionContent.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 300px; color: var(--text-muted); font-style: italic;">
          Loading ${sectionName} information...
        </div>
      `;
    }
  }

  startMockData() {
    // Generate mock data for testing
    console.log('Starting mock data generation...');
    
    setInterval(() => {
      const mockStats = {
        timestamp: Date.now(),
        cpu: {
          usage: 30 + Math.random() * 40,
          info: {
            brand: 'Mock CPU',
            cores: 8,
            physicalCores: 4,
            speed: 3.2
          }
        },
        memory: {
          usagePercent: 45 + Math.random() * 30,
          total: 16 * 1024 * 1024 * 1024,
          used: 8 * 1024 * 1024 * 1024,
          available: 8 * 1024 * 1024 * 1024,
          formatted: {
            total: { value: 16.0, unit: 'GB' },
            used: { value: 8.0, unit: 'GB' },
            available: { value: 8.0, unit: 'GB' }
          }
        },
        gpu: {
          controllers: [{
            name: 'Mock GPU',
            vendor: 'Mock Vendor',
            utilization: Math.random() * 60,
            vram: 8192
          }]
        },
        storage: {
          filesystem: [
            {
              fs: 'C:',
              type: 'NTFS',
              size: 500 * 1024 * 1024 * 1024,
              used: 325 * 1024 * 1024 * 1024,
              available: 175 * 1024 * 1024 * 1024,
              usagePercent: 65,
              mount: 'C:',
              formatted: {
                size: { value: 500, unit: 'GB' },
                used: { value: 325, unit: 'GB' },
                available: { value: 175, unit: 'GB' }
              }
            },
            {
              fs: 'D:',
              type: 'NTFS',
              size: 1024 * 1024 * 1024 * 1024,
              used: 512 * 1024 * 1024 * 1024,
              available: 512 * 1024 * 1024 * 1024,
              usagePercent: 50,
              mount: 'D:',
              formatted: {
                size: { value: 1.0, unit: 'TB' },
                used: { value: 512, unit: 'GB' },
                available: { value: 512, unit: 'GB' }
              }
            }
          ],
          io: {
            rates: {
              read: Math.random() * 100 * 1024 * 1024,
              write: Math.random() * 50 * 1024 * 1024
            }
          }
        },
        network: {
          connections: {
            active: Math.floor(Math.random() * 100) + 50
          },
          totals: {
            rates: {
              rx: Math.random() * 1024 * 1024,
              tx: Math.random() * 512 * 1024,
              formatted: {
                rx: { value: (Math.random() * 1024).toFixed(1), unit: 'KB/s' },
                tx: { value: (Math.random() * 512).toFixed(1), unit: 'KB/s' }
              }
            }
          }
        },
        npu: {
          available: false,
          npus: []
        }
      };
      
      this.handleStatsUpdate(mockStats);
    }, 1000);
  }
}

// Initialize the application when DOM is ready
const pmon = new PMon();
window.pmonInstance = pmon; // Make globally available for event handlers
