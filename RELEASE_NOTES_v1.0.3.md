# PMon v1.0.3 Release Notes

## Overview
PMon is a cross-platform performance monitoring application built with Electron, providing real-time system monitoring with a modern, responsive interface.

## New in v1.0.3

### 🔧 Critical NPU Detection Fix
- **Fixed False Positive NPU Detection**: Resolved issue where "USB Input Device" names containing "NPU" substring caused false NPU detection
- **Improved Detection Logic**: Now uses specific queries for "Neural", "Intel NPU", and "Neural Processing" to avoid false matches
- **Accurate Hardware Recognition**: NPU detection now correctly reports "not detected" on systems without NPU hardware

### 🎨 NPU Tab Layout Improvements
- **Enhanced Typography**: Replaced cramped inline styles with proper CSS classes and spacing
- **Better Visual Hierarchy**: Clear separation between status, description, and support information sections
- **Professional Layout**: Improved spacing, margins, and line heights prevent text overlapping
- **Responsive Design**: Optimized layout works seamlessly across mobile (480px) to desktop (1600px+)

### 📱 User Experience Enhancements
- **Cleaner NPU Status Display**: Shows clear "NPU ❌ NOT DETECTED" when no NPU hardware is present
- **Hidden Overview Card**: NPU card properly hidden from main overview when no NPU detected
- **Maintained Tab Access**: NPU tab remains accessible for educational information about NPU support
- **Better Error Messaging**: More informative detection status with hardware support details

## Features

### Real-time System Monitoring
- **CPU**: Usage percentage, temperature, core count, and load averages
- **Memory**: RAM usage, available memory, swap usage with visual indicators
- **GPU**: GPU utilization, temperature, memory usage, and vendor information
- **Storage**: Drive information, I/O performance, disk usage (no percentage clutter)
- **Network**: Traffic monitoring, connection statistics, interface information
- **NPU**: Accurate Neural Processing Unit detection and information (when available)
- **Motherboard**: System information, temperatures, and hardware details

### Interface Features
- Modern, responsive dark/light theme design
- Interactive charts with Chart.js integration
- Real-time animated performance graphs
- System tray integration for background monitoring
- Tabbed interface for organized metric viewing
- Responsive grid layout that scales from mobile to 4K displays
- Accurate hardware detection without false positives

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
- NPU detection: Intel NPU (Meteor Lake+), Apple Neural Engine, AMD XDNA, Qualcomm AI Engine

## Installation

### Windows Installation
1. Download `PMon Setup 1.0.3.exe` (86.1 MB)
2. Run the installer as Administrator
3. Follow the installation wizard
4. Launch PMon from Start Menu or Desktop shortcut

### Portable Version
The `win-unpacked` folder contains a portable version:
1. Extract the folder to desired location
2. Run `Launch-PMon-Portable.bat` or `PMon.exe` directly
3. No installation required

## What's Fixed Since v1.0.2

### 🐛 Bug Fixes
- **NPU False Positives**: Fixed incorrect NPU detection on systems with USB Input devices
- **Layout Issues**: Resolved text overlapping and cramped spacing in NPU tab
- **Detection Accuracy**: Improved hardware detection specificity and error handling

### 🔧 Technical Improvements
- Enhanced WMIC query handling with proper "No Instance(s) Available" detection
- Better CSS organization with dedicated NPU status panel classes
- Improved responsive breakpoints for NPU tab layout
- More robust NPU detection logic with multiple specific query methods

## Performance
- **Memory Usage**: ~50-80MB RAM
- **CPU Usage**: <1% on modern systems
- **Update Frequency**: 
  - Light metrics (CPU, Memory): 1 second
  - Heavy metrics (GPU, Storage): 3 seconds
  - System info (Motherboard): 30 seconds

## Architecture
- **Main Process**: Application lifecycle and system tray
- **Monitoring Service**: Real-time system data collection with accurate hardware detection
- **Renderer Process**: UI with Chart.js visualizations and responsive design
- **Security**: Context isolation, secure IPC communication

## Known Issues
- Linux builds require WSL or native Linux environment
- macOS builds require Xcode on macOS system
- Some GPU temperature sensors may not be detected on older hardware
- NPU monitoring requires vendor-specific APIs not currently available in PMon

## Support
For issues, feature requests, or contributions:
- GitHub: https://github.com/d3momonkey/PMon
- Documentation: See README.md and WARP.md in the project directory

---

**Build Information**
- Version: 1.0.3
- Build Date: September 14, 2025
- Electron Version: 38.0.0
- Node.js Version: Compatible with Electron 38.x
- Platform: Windows x64

**Changelog Summary**
- v1.0.1: Storage data loading fixes, UI scaling improvements, percentage removal
- v1.0.2: NPU simulated data removal, card hiding logic, detection improvements  
- v1.0.3: NPU false positive fixes, layout improvements, professional styling