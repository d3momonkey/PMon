# PMon v1.0.1 Release Notes

## Overview
PMon is a cross-platform performance monitoring application built with Electron, providing real-time system monitoring with a modern, responsive interface.

## New in v1.0.1

### 🔧 Critical Fixes
- **Fixed Storage Data Loading**: Resolved issue where storage tab showed "Loading storage information..." indefinitely
- **Enhanced UI Card Scaling**: Improved responsive design for better scaling across different screen sizes
- **Removed Storage Usage Percentages**: Cleaned up storage display by removing usage percentage indicators per user feedback

### 🎨 UI/UX Improvements
- Better responsive breakpoints for mobile and desktop viewing
- Improved card aspect ratios and text handling
- Enhanced layout consistency across all screen sizes
- Fixed text overflow issues with multi-line content support

### 🔧 Technical Improvements
- Fixed storage data initialization on application startup
- Enhanced monitoring service scheduling for immediate storage data availability
- Improved error handling and safety checks for storage module
- Better mock data structure for testing and development

## Features

### Real-time System Monitoring
- **CPU**: Usage percentage, temperature, core count, and load averages
- **Memory**: RAM usage, available memory, swap usage with visual indicators
- **GPU**: GPU utilization, temperature, memory usage, and vendor information
- **Storage**: Drive information, I/O performance, disk usage without percentages
- **Network**: Traffic monitoring, connection statistics, interface information
- **NPU**: Neural Processing Unit detection and information (if available)
- **Motherboard**: System information, temperatures, and hardware details

### Interface Features
- Modern, responsive dark/light theme design
- Interactive charts with Chart.js integration
- Real-time animated performance graphs
- System tray integration for background monitoring
- Tabbed interface for organized metric viewing
- Responsive grid layout that scales from mobile to 4K displays

## System Requirements

### Windows
- Windows 10 or later
- 4GB RAM minimum (8GB recommended)
- 200MB free disk space

### Hardware Support
- Intel/AMD CPUs with temperature sensors
- NVIDIA/AMD GPUs with monitoring support
- Standard SATA/NVMe storage devices
- Network interfaces (Ethernet/Wi-Fi)

## Installation

### Windows Installation
1. Download `PMon Setup 1.0.1.exe` (86.1 MB)
2. Run the installer as Administrator
3. Follow the installation wizard
4. Launch PMon from Start Menu or Desktop shortcut

### Portable Version
The `win-unpacked` folder contains a portable version:
1. Extract the folder to desired location
2. Run `PMon.exe` directly
3. No installation required

## Performance
- **Memory Usage**: ~50-80MB RAM
- **CPU Usage**: <1% on modern systems
- **Update Frequency**: 
  - Light metrics (CPU, Memory): 1 second
  - Heavy metrics (GPU, Storage): 3 seconds
  - System info (Motherboard): 30 seconds

## Architecture
- **Main Process**: Application lifecycle and system tray
- **Monitoring Service**: Real-time system data collection
- **Renderer Process**: UI with Chart.js visualizations
- **Security**: Context isolation, secure IPC communication

## Known Issues
- Linux builds require WSL or native Linux environment
- macOS builds require Xcode on macOS system
- Some GPU temperature sensors may not be detected on older hardware

## Support
For issues, feature requests, or contributions:
- GitHub: https://github.com/d3momonkey/PMon
- Documentation: See README.md and WARP.md in the project directory

---

**Build Information**
- Version: 1.0.1
- Build Date: September 14, 2025
- Electron Version: 38.0.0
- Node.js Version: Compatible with Electron 38.x
- Platform: Windows x64