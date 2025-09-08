class ChartManager {
  constructor() {
    this.charts = new Map();
    this.theme = 'dark';
    this.maxDataPoints = 60; // Keep 1 minute of data
    
    // Chart.js defaults
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    Chart.defaults.font.size = 11;
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.animation.duration = 300;
    Chart.defaults.elements.line.tension = 0.3;
    Chart.defaults.elements.point.radius = 0;
    Chart.defaults.elements.point.hoverRadius = 4;
  }

  getThemeColors() {
    const isDark = document.body.classList.contains('theme-dark');
    
    return {
      primary: isDark ? '#ffffff' : '#1a1a1a',
      secondary: isDark ? '#b3b3b3' : '#666666',
      muted: isDark ? '#808080' : '#999999',
      grid: isDark ? '#404040' : '#e0e0e0',
      background: isDark ? '#2a2a2a' : '#ffffff'
    };
  }

  createBaseConfig(type = 'line') {
    const colors = this.getThemeColors();
    
    return {
      type: type,
      data: {
        labels: [],
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          tooltip: {
            backgroundColor: colors.background,
            titleColor: colors.primary,
            bodyColor: colors.secondary,
            borderColor: colors.grid,
            borderWidth: 1,
            cornerRadius: 4,
            displayColors: true,
            titleFont: { weight: 'bold', size: 12 },
            bodyFont: { size: 11 }
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              color: colors.grid,
              drawBorder: false
            },
            ticks: {
              color: colors.muted,
              maxTicksLimit: 6,
              font: { size: 10 }
            }
          },
          y: {
            display: true,
            beginAtZero: true,
            grid: {
              color: colors.grid,
              drawBorder: false
            },
            ticks: {
              color: colors.muted,
              font: { size: 10 }
            }
          }
        }
      }
    };
  }

createCPUChart(canvasId, isMainChart = false) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    // Ensure mini charts have proper canvas sizing
    if (!isMainChart) {
      canvas.style.maxHeight = '60px';
      canvas.style.maxWidth = '100%';
      canvas.style.height = '60px';
    }

    const config = this.createBaseConfig('line');
    
    config.data.datasets = [{
      label: 'CPU Usage (%)',
      data: [],
      borderColor: '#2196f3',
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.3
    }];

    config.options.scales.y.max = 100;
    config.options.scales.y.ticks.callback = (value) => value + '%';

if (!isMainChart) {
      config.options.scales.x.display = false;
      config.options.scales.y.display = false;
      config.options.plugins.tooltip.enabled = false;
      config.options.maintainAspectRatio = false;
      config.options.responsive = true;
      config.options.resizeDelay = 0;
      // Additional containment options
      config.options.layout = {
        padding: 0
      };
      config.options.elements = {
        ...config.options.elements,
        point: {
          radius: 0,
          hoverRadius: 0
        }
      };
    }

    const chart = new Chart(canvas, config);
    this.charts.set(canvasId, chart);
    return chart;
  }

createMemoryChart(canvasId, isMainChart = false) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    // Ensure mini charts have proper canvas sizing
    if (!isMainChart) {
      canvas.style.maxHeight = '60px';
      canvas.style.maxWidth = '100%';
      canvas.style.height = '60px';
    }

    const config = this.createBaseConfig('line');
    
    config.data.datasets = [{
      label: 'Memory Usage (%)',
      data: [],
      borderColor: '#007acc',
      backgroundColor: 'rgba(0, 122, 204, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.3
    }];

    config.options.scales.y.max = 100;
    config.options.scales.y.ticks.callback = (value) => value + '%';

if (!isMainChart) {
      config.options.scales.x.display = false;
      config.options.scales.y.display = false;
      config.options.plugins.tooltip.enabled = false;
      config.options.maintainAspectRatio = false;
      config.options.responsive = true;
      config.options.resizeDelay = 0;
      config.options.layout = {
        padding: 0
      };
      config.options.elements = {
        ...config.options.elements,
        point: {
          radius: 0,
          hoverRadius: 0
        }
      };
    }

    const chart = new Chart(canvas, config);
    this.charts.set(canvasId, chart);
    return chart;
  }

createGPUChart(canvasId, isMainChart = false) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    // Ensure mini charts have proper canvas sizing
    if (!isMainChart) {
      canvas.style.maxHeight = '60px';
      canvas.style.maxWidth = '100%';
      canvas.style.height = '60px';
    }

    const config = this.createBaseConfig('line');
    
    config.data.datasets = [{
      label: 'GPU Usage (%)',
      data: [],
      borderColor: '#4caf50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.3
    }];

    config.options.scales.y.max = 100;
    config.options.scales.y.ticks.callback = (value) => value + '%';

if (!isMainChart) {
      config.options.scales.x.display = false;
      config.options.scales.y.display = false;
      config.options.plugins.tooltip.enabled = false;
      config.options.maintainAspectRatio = false;
      config.options.responsive = true;
      config.options.resizeDelay = 0;
      config.options.layout = {
        padding: 0
      };
      config.options.elements = {
        ...config.options.elements,
        point: {
          radius: 0,
          hoverRadius: 0
        }
      };
    }

    const chart = new Chart(canvas, config);
    this.charts.set(canvasId, chart);
    return chart;
  }

createNetworkChart(canvasId, isMainChart = false) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    // Ensure mini charts have proper canvas sizing
    if (!isMainChart) {
      canvas.style.maxHeight = '60px';
      canvas.style.maxWidth = '100%';
      canvas.style.height = '60px';
    }

    const config = this.createBaseConfig('line');
    
    config.data.datasets = [
      {
        label: 'Download (KB/s)',
        data: [],
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3
      },
      {
        label: 'Upload (KB/s)',
        data: [],
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3
      }
    ];

    config.options.scales.y.ticks.callback = (value) => {
      return this.formatBytesPerSecond(value * 1024);
    };

if (!isMainChart) {
      config.options.scales.x.display = false;
      config.options.scales.y.display = false;
      config.options.plugins.tooltip.enabled = false;
      config.options.maintainAspectRatio = false;
      config.options.responsive = true;
      config.options.resizeDelay = 0;
      config.options.layout = {
        padding: 0
      };
      config.options.elements = {
        ...config.options.elements,
        point: {
          radius: 0,
          hoverRadius: 0
        }
      };
      // Only show download for mini chart
      config.data.datasets = config.data.datasets.slice(0, 1);
    }

    const chart = new Chart(canvas, config);
    this.charts.set(canvasId, chart);
    return chart;
  }

  updateChart(chartId, newData, labels = null) {
    const chart = this.charts.get(chartId);
    if (!chart) return;

    // Update labels if provided
    if (labels) {
      chart.data.labels = labels.slice(-this.maxDataPoints);
    } else if (chart.data.labels.length >= this.maxDataPoints) {
      chart.data.labels.shift();
    }

    // Update datasets
    if (Array.isArray(newData)) {
      // Multiple datasets (e.g., network chart)
      newData.forEach((data, index) => {
        if (chart.data.datasets[index]) {
          if (chart.data.datasets[index].data.length >= this.maxDataPoints) {
            chart.data.datasets[index].data.shift();
          }
          chart.data.datasets[index].data.push(data);
        }
      });
    } else {
      // Single dataset
      if (chart.data.datasets[0].data.length >= this.maxDataPoints) {
        chart.data.datasets[0].data.shift();
      }
      chart.data.datasets[0].data.push(newData);
    }

    // Add timestamp label if none provided
    if (!labels && chart.data.labels.length < chart.data.datasets[0].data.length) {
      const now = new Date();
      chart.data.labels.push(now.toLocaleTimeString('en-US', { 
        hour12: false, 
        minute: '2-digit', 
        second: '2-digit' 
      }));
    }

    chart.update('none'); // No animation for real-time updates
  }

  updateMemoryRing(percentage) {
    const circle = document.querySelector('#memory-progress .progress-ring-circle');
    if (!circle) return;

    const circumference = 2 * Math.PI * 32; // 32 is the radius
    const offset = circumference - (percentage / 100) * circumference;
    
    circle.style.strokeDashoffset = offset;
  }

  updateStorageRing(percentage) {
    const circle = document.querySelector('#storage-progress .progress-ring-circle');
    if (!circle) return;

    const circumference = 2 * Math.PI * 32; // 32 is the radius
    const offset = circumference - (percentage / 100) * circumference;
    
    circle.style.strokeDashoffset = offset;
  }

  updateStorageBars(readRate, writeRate, maxRate = null) {
    const readBar = document.getElementById('storage-read-bar');
    const writeBar = document.getElementById('storage-write-bar');
    const readValue = document.getElementById('storage-read-value');
    const writeValue = document.getElementById('storage-write-value');

    if (!readBar || !writeBar || !readValue || !writeValue) return;

    // Auto-scale if no max rate provided
    if (!maxRate) {
      maxRate = Math.max(readRate, writeRate, 1024 * 1024); // At least 1MB/s scale
    }

    const readPercent = Math.min((readRate / maxRate) * 100, 100);
    const writePercent = Math.min((writeRate / maxRate) * 100, 100);

    readBar.style.width = readPercent + '%';
    writeBar.style.width = writePercent + '%';

    readValue.textContent = this.formatBytesPerSecond(readRate);
    writeValue.textContent = this.formatBytesPerSecond(writeRate);
  }

  formatBytesPerSecond(bytes) {
    if (bytes === 0) return '0 B/s';
    
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = (bytes / Math.pow(1024, i)).toFixed(1);
    
    return `${value} ${units[i]}`;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = (bytes / Math.pow(1024, i)).toFixed(1);
    
    return `${value} ${units[i]}`;
  }

  updateTheme() {
    // Recreate all charts with new theme
    const chartIds = Array.from(this.charts.keys());
    chartIds.forEach(chartId => {
      const chart = this.charts.get(chartId);
      if (chart) {
        chart.destroy();
        this.charts.delete(chartId);
      }
    });

    // Recreate charts - this will be called by the main app
    window.dispatchEvent(new CustomEvent('theme-changed'));
  }

  destroy() {
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
  }
}

// Export for use in main.js
window.ChartManager = ChartManager;
