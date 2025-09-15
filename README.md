# PMon - Cross-Platform Performance Monitor

![PMon Screenshot](assets/screenshot.png)

**PMon** is a sleek, modern system performance monitor built with Electron. It provides real-time monitoring of your system's CPU, Memory, GPU, Storage, Network, and NPU (Neural Processing Unit) with beautiful animated charts and a responsive dark/light theme interface.

## ✨ Features

### 🔥 **Core Monitoring**
- **CPU Usage** - Real-time processor utilization with detailed core information
- **Memory Usage** - RAM consumption with available/used/total breakdowns
- **GPU Monitoring** - Graphics card utilization, VRAM usage, and temperature
- **Storage I/O** - Disk read/write rates and filesystem usage
- **Network Traffic** - Upload/download speeds and active connections
- **NPU Status** - Neural Processing Unit detection and availability

### 🎨 **User Interface**
- **Modern Dark/Light Themes** - Toggle between sleek dark and clean light modes
- **Animated Charts** - Real-time Chart.js visualizations with smooth animations
- **Card-Based Overview** - Quick summary cards with click-to-navigate functionality
- **Detailed Views** - Comprehensive detailed sections for each system component
- **Responsive Design** - Adapts beautifully to different window sizes

### ⚡ **Performance**
- **Cross-Platform** - Windows, macOS, and Linux support
- **Low Resource Usage** - Minimal CPU and memory footprint
- **Real-Time Updates** - 1-second refresh rate for most metrics
- **Efficient Monitoring** - Smart update scheduling for heavy operations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git for version control

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/PMon.git
cd PMon
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the application**
```bash
npm start
```

### Development Mode
```bash
npm run dev
```
This opens the app with developer tools for debugging.

### Building for Production
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux

# All platforms
npm run build:all
```

## 📁 Project Structure

```
PMon/
├── main/                   # Main Electron process
│   ├── index.js           # Application entry point
│   └── preload.js         # Preload script for secure IPC
├── modules/               # System monitoring modules
│   ├── cpu.js            # CPU monitoring
│   ├── memory.js         # Memory monitoring
│   ├── gpu.js            # GPU monitoring
│   ├── npu.js            # NPU detection
│   ├── storage.js        # Storage I/O monitoring
│   ├── network.js        # Network monitoring
│   └── monitoring-service.js # Central monitoring service
├── renderer/              # Frontend UI
│   ├── index.html        # Main HTML structure
│   ├── styles/           # CSS stylesheets
│   │   ├── main.css      # Core styles and themes
│   │   ├── components.css # UI component styles
│   │   └── charts.css    # Chart-specific styles
│   └── scripts/          # Frontend JavaScript
│       ├── main.js       # Main application logic
│       ├── charts.js     # Chart management
│       └── components.js # UI component handlers
├── assets/               # Static assets
│   ├── icon.png         # Application icon
│   └── tray-icon.png    # System tray icon
├── dist/                 # Built application files
├── package.json          # Project dependencies
└── README.md            # This file
```

## 🛠️ Architecture

### Main Process (`main/`)
- **index.js**: Electron main process, window management, menu setup
- **preload.js**: Secure bridge between main and renderer processes

### Monitoring Engine (`modules/`)
- **monitoring-service.js**: Central service that coordinates all monitoring
- Individual modules for each system component (CPU, Memory, etc.)
- Uses the `systeminformation` library for cross-platform system data

### Frontend (`renderer/`)
- **Vanilla JavaScript** with modern ES6+ features
- **Chart.js** for beautiful animated charts
- **CSS Grid and Flexbox** for responsive layouts
- **CSS Custom Properties** for theming

### Communication Flow
```
System Data → Monitoring Modules → Main Process → IPC → Renderer → UI Update
```

## 🎯 Key Features Explained

### Smart Card Navigation
Click any summary card to navigate to detailed monitoring:
- **CPU Card** → Detailed CPU usage charts and processor specs
- **Memory Card** → Memory breakdown and usage history
- **GPU Card** → Graphics performance and VRAM monitoring
- **Storage Card** → Disk I/O charts and filesystem information
- **Network Card** → Traffic charts and interface details
- **NPU Card** → Neural processor detection and status

### Theme System
Toggle between dark and light themes with the 🌙/☀️ button:
- Themes use CSS custom properties for instant switching
- Preferences saved to localStorage
- Charts automatically adapt to theme changes

### Real-Time Charts
- **CPU**: Line chart showing usage over time
- **Memory**: Progress rings and usage bars
- **GPU**: Utilization charts with temperature monitoring
- **Storage**: I/O rate charts with filesystem usage
- **Network**: Traffic charts with upload/download rates

## 🔧 Configuration

### Monitoring Intervals
Edit `modules/monitoring-service.js` to customize update frequencies:
- **Light metrics** (CPU, Memory, Network): 1000ms
- **Heavy metrics** (GPU, NPU, Storage): 3000ms

### UI Customization
- **Themes**: Modify CSS custom properties in `renderer/styles/main.css`
- **Charts**: Customize Chart.js options in `renderer/scripts/charts.js`
- **Layout**: Adjust grid layouts in `renderer/styles/components.css`

## 🐛 Troubleshooting

### Common Issues

**App doesn't start**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Charts not displaying**
- Ensure Chart.js CDN is accessible
- Check browser console for JavaScript errors

**Blank sections when clicking cards** ✅ FIXED
- This issue has been resolved in v1.0.1
- Card navigation now works properly across all sections

**Storage tab shows "Loading storage information..." indefinitely** ✅ FIXED
- Storage data now loads immediately on application startup
- All drives are properly detected and displayed with usage information
- Individual drive details show correctly for multiple drives

**Cards don't scale properly on different screen sizes** ✅ FIXED
- Improved responsive breakpoints for better 7-card layout
- Cards now maintain consistent proportions across all screen sizes
- Text and content scale appropriately without overflow

**High CPU usage**
- Increase monitoring intervals in `monitoring-service.js`
- Close unused detailed sections

### Debug Mode
Run with debug information:
```bash
npm start -- --dev
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit with clear messages**: `git commit -m "Add amazing feature"`
5. **Push to your fork**: `git push origin feature/amazing-feature`
6. **Create a Pull Request**

### Development Guidelines
- Follow existing code style and structure
- Add comments for complex logic
- Test on multiple platforms if possible
- Update documentation for new features

## 📈 Performance Considerations

### Resource Usage
- **Memory**: ~50-80MB typical usage
- **CPU**: <1% on modern systems
- **Disk**: Minimal I/O, mostly read operations

### Optimization Tips
- Close unused detail sections when not needed
- Increase monitoring intervals for older systems
- Disable animations for better performance on low-end devices

## 🔒 Security

PMon follows Electron security best practices:
- **Context Isolation**: Enabled for all renderer processes
- **Node Integration**: Disabled in renderer
- **Content Security Policy**: Implemented
- **Secure IPC**: All communication via preload script

## 📊 System Requirements

### Minimum
- **OS**: Windows 10, macOS 10.14, Ubuntu 18.04
- **RAM**: 4GB
- **Storage**: 200MB free space

### Recommended
- **OS**: Latest stable versions
- **RAM**: 8GB+
- **Storage**: 500MB free space

## 📝 Changelog

### v1.0.1 (Latest)
- ✅ **Fixed storage data loading issue** - All drives now display correctly in storage tab
- ✅ **Improved UI card scaling** - Better responsive design across all screen sizes
- ✅ **Enhanced storage detection** - Immediate loading of storage data on startup
- ✅ **Fixed card navigation issue** - Smooth navigation between sections
- ✅ **Comprehensive system monitoring** - CPU, Memory, GPU, Storage, Network, NPU, Motherboard
- ✅ **Dark/light theme support** - Instant theme switching with chart integration
- ✅ **Real-time animated charts** - Chart.js integration with theme-aware styling
- ✅ **Cross-platform compatibility** - Windows, macOS, Linux support
- ✅ **NPU detection support** - Neural Processing Unit detection and status

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Electron** - For the amazing cross-platform framework
- **Chart.js** - For beautiful, responsive charts
- **systeminformation** - For comprehensive system data
- **Contributors** - Everyone who helped make PMon better

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/PMon/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/PMon/discussions)
- **Documentation**: This README and inline code comments

---

**Made with ❤️ for system monitoring enthusiasts**

*PMon - Know your system, optimize your workflow.*
