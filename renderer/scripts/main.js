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
    this.lastStats = stats;
    this.updateLastUpdatedTime();
    
    // Update overview cards
    this.updateOverviewCards(stats);
    
    // Update detailed sections if active
    this.updateDetailedSections(stats);
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
    if (stats.storage && stats.storage.io) {
      const storageUsage = document.getElementById('storage-usage');
      const storageDetails = document.getElementById('storage-details');
      
      // Calculate average filesystem usage
      const avgUsage = stats.storage.filesystem.length > 0 ? 
        stats.storage.filesystem.reduce((acc, fs) => acc + fs.usagePercent, 0) / stats.storage.filesystem.length : 0;
      
      if (storageUsage) storageUsage.textContent = `${avgUsage.toFixed(1)}%`;
      if (storageDetails) {
        const totalDisks = stats.storage.filesystem.length;
        storageDetails.textContent = `${totalDisks} drive${totalDisks !== 1 ? 's' : ''}`;
      }
      
      // Update storage bars
      const readRate = stats.storage.io.rates.read || 0;
      const writeRate = stats.storage.io.rates.write || 0;
      this.chartManager.updateStorageBars(readRate, writeRate);
    }

    // Network Card
    if (stats.network) {
      const networkConnections = document.getElementById('network-connections');
      const networkDetails = document.getElementById('network-details');
      
      if (networkConnections) {
        networkConnections.textContent = stats.network.connections.active.toString();
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
      if (storageContent && stats.storage) {
        
        // Only create the HTML structure once
        if (!storageContent.querySelector('.storage-overview')) {
          let html = '<div class="storage-overview">';
          
          // Add I/O Chart section
          html += `
            <div class="detail-grid">
              <div class="chart-container">
                <h4>Storage I/O</h4>
                <canvas id="storage-main-chart"></canvas>
              </div>
              <div class="info-panel">
                <div class="info-group">
                  <h4>I/O Statistics</h4>
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
          
          // Filesystem information
          if (stats.storage.filesystem.length > 0) {
            html += '<div class="info-group"><h4>Filesystems</h4>';
            stats.storage.filesystem.forEach(fs => {
              html += `
                <div class="storage-item">
                  <div class="storage-header">
                    <span class="fs-name">${fs.fs}</span>
                    <span class="fs-usage">${fs.usagePercent.toFixed(1)}%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(fs.usagePercent, 100)}%"></div>
                  </div>
                  <div class="fs-details">
                    ${fs.formatted.used.value} ${fs.formatted.used.unit} / 
                    ${fs.formatted.size.value} ${fs.formatted.size.unit} 
                    (${fs.formatted.available.value} ${fs.formatted.available.unit} free)
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
        }
        
        // Update I/O rates
        if (stats.storage.io && stats.storage.io.rates) {
          const readRate = stats.storage.io.rates.read || 0;
          const writeRate = stats.storage.io.rates.write || 0;
          
          document.getElementById('storage-read-rate').textContent = this.chartManager.formatBytesPerSecond(readRate);
          document.getElementById('storage-write-rate').textContent = this.chartManager.formatBytesPerSecond(writeRate);
          
          // Update chart
          this.chartManager.updateChart('storage-main-chart', [readRate / 1024 / 1024, writeRate / 1024 / 1024]); // Convert to MB/s
        }
      }
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
              </div>
            </div>
          `;
          
          // Network interfaces
          if (stats.network.interfaces.length > 0) {
            html += '<div class="info-group"><h4>Network Interfaces</h4>';
            stats.network.interfaces.forEach(iface => {
              if (iface.info && !iface.info.internal) {
                html += `
                  <div class="network-item">
                    <div class="network-header">
                      <span class="iface-name">${iface.iface}</span>
                      <span class="iface-status ${iface.operstate === 'up' ? 'active' : 'inactive'}">${iface.operstate}</span>
                    </div>
                    <div class="network-details">
                      IP: ${iface.info.ip4 || 'N/A'} | 
                      MAC: ${iface.info.mac || 'N/A'} | 
                      Speed: ${iface.info.speed ? iface.info.speed + ' Mbps' : 'N/A'}
                    </div>
                    <div class="network-stats" id="iface-${iface.iface}-stats">
                      ↓ ${iface.rates?.formatted?.rx?.value || '0'} ${iface.rates?.formatted?.rx?.unit || 'B/s'} | 
                      ↑ ${iface.rates?.formatted?.tx?.value || '0'} ${iface.rates?.formatted?.tx?.unit || 'B/s'}
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
          
          document.getElementById('network-download-rate').textContent = this.chartManager.formatBytesPerSecond(rxRate);
          document.getElementById('network-upload-rate').textContent = this.chartManager.formatBytesPerSecond(txRate);
          document.getElementById('network-active-connections').textContent = stats.network.connections.active || 0;
          
          // Update chart (convert to KB/s)
          this.chartManager.updateChart('network-main-chart', [rxRate / 1024, txRate / 1024]);
        }
        
        // Update individual interface stats
        stats.network.interfaces.forEach(iface => {
          if (iface.info && !iface.info.internal && iface.rates) {
            const statsElement = document.getElementById(`iface-${iface.iface}-stats`);
            if (statsElement) {
              statsElement.innerHTML = `
                ↓ ${iface.rates.formatted?.rx?.value || '0'} ${iface.rates.formatted?.rx?.unit || 'B/s'} | 
                ↑ ${iface.rates.formatted?.tx?.value || '0'} ${iface.rates.formatted?.tx?.unit || 'B/s'}
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
    if (storageContent && !storageContent.querySelector('.detail-grid')) {
      storageContent.innerHTML = `
        <div class="detail-grid">
          <div class="chart-container">
            <h4>Storage I/O</h4>
            <canvas id="storage-main-chart"></canvas>
          </div>
          <div class="info-panel">
            <div class="info-group">
              <h4>I/O Statistics</h4>
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
          filesystem: [{
            fs: 'C:',
            usagePercent: 65,
            formatted: {
              size: { value: 500, unit: 'GB' },
              used: { value: 325, unit: 'GB' },
              available: { value: 175, unit: 'GB' }
            }
          }],
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
