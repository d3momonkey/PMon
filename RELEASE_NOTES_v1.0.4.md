# PMon v1.0.4 Release Notes

**Author:** Craig Raymond  
**Developer:** DemoMonkey Studios  
**License:** MIT

## Overview
PMon is a cross-platform performance monitoring application built with Electron, providing real-time system monitoring with a modern, responsive interface. This release focuses on comprehensive professional attribution and code documentation.

## New in v1.0.4

### 📝 Professional Attribution & Documentation
- **Complete Author Attribution**: Added comprehensive author and developer information throughout entire codebase
- **Professional Headers**: Every JavaScript file now includes proper JSDoc-style header comments with attribution
- **Enhanced Package Configuration**: Updated package.json with professional author object and contributor information
- **Meta Tag Enhancement**: HTML includes comprehensive meta tags for author, developer, and application information

### ✨ Code Documentation Improvements
- **Header Comments**: Added professional header blocks to all 12+ JavaScript files including modules and renderer scripts
- **Consistent Formatting**: Standardized attribution format across entire project
- **Version Alignment**: All files now reference correct version 1.0.4 throughout
- **License Information**: MIT license clearly specified in all relevant locations

### 📚 Documentation Updates
- **README.md**: Enhanced with author information in header and footer sections
- **WARP.md**: Updated developer guidance with proper attribution
- **Release Notes**: All release documentation includes comprehensive author information
- **Meta Information**: Professional meta tags added to HTML for better application identification

### 🏢 Professional Standards
- **Author**: Craig Raymond clearly identified throughout project
- **Developer Studio**: DemoMonkey Studios attribution in all appropriate locations
- **Contact Information**: Professional contact details included in package configuration
- **Consistent Branding**: Unified attribution across code, documentation, and build files

## Features (Unchanged from v1.0.3)

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
1. Download `PMon Setup 1.0.4.exe` (86.1 MB)
2. Run the installer as Administrator
3. Follow the installation wizard
4. Launch PMon from Start Menu or Desktop shortcut

### Portable Version
The `win-unpacked` folder contains a portable version:
1. Extract the folder to desired location
2. Run `Launch-PMon-Portable.bat` or `PMon.exe` directly
3. No installation required

## What's New Since v1.0.3

### 🔧 Attribution & Documentation
- **Comprehensive Code Headers**: Every JavaScript file includes professional attribution
- **Enhanced Package.json**: Professional author object with contact information and contributors
- **Meta Tag Updates**: HTML includes comprehensive application meta information
- **Documentation Enhancement**: All documentation files updated with proper attribution
- **Professional Standards**: Consistent branding and attribution throughout entire project

### 📂 Files Updated (18 files total)
- **Main Process**: `main/index.js` with full header attribution
- **Monitoring Modules**: All 8 monitoring modules with professional headers
- **Renderer Scripts**: All 3 renderer scripts with attribution
- **HTML**: Enhanced with meta tags and header comments
- **Documentation**: README, WARP, and all release notes updated
- **Package Configuration**: Professional author and contributor information

## Attribution Details

### Header Comment Format
```javascript
/**
 * PMon - Performance Monitor
 * [Module Description]
 * 
 * @description [Specific functionality]
 * @author Craig Raymond
 * @developer DemoMonkey Studios
 * @version 1.0.4
 * @license MIT
 */
```

### Package.json Author Object
```json
{
  "author": {
    "name": "Craig Raymond",
    "email": "craig@demomonkey.com",
    "url": "https://github.com/d3momonkey"
  },
  "contributors": [
    {
      "name": "DemoMonkey Studios", 
      "url": "https://demomonkey.com"
    }
  ]
}
```

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
- **GitHub**: https://github.com/d3momonkey/PMon
- **Author**: Craig Raymond
- **Developer**: DemoMonkey Studios
- **Documentation**: See README.md and WARP.md in the project directory

---

**Build Information**
- **Version**: 1.0.4
- **Build Date**: September 14, 2025
- **Author**: Craig Raymond
- **Developer**: DemoMonkey Studios
- **Electron Version**: 38.0.0
- **Node.js Version**: Compatible with Electron 38.x
- **Platform**: Windows x64

**Complete Version History**
- **v1.0.1**: Storage data loading fixes, UI scaling improvements, percentage removal
- **v1.0.2**: NPU simulated data removal, card hiding logic, detection improvements  
- **v1.0.3**: NPU false positive fixes, layout improvements, professional styling
- **v1.0.4**: Comprehensive author attribution, professional documentation, code headers

---

**Professional Development by DemoMonkey Studios**  
**Created by Craig Raymond**  
*PMon - Know your system, optimize your workflow.*