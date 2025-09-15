/**
 * PMon - Performance Monitor
 * UI Components and Utilities
 * 
 * @description Shared UI components and utility functions
 * @author Craig Raymond
 * @developer DemoMonkey Studios
 * @version 1.0.3
 * @license MIT
 */

// Utility functions and shared components

// Format bytes utility function
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Format bytes per second utility function
function formatBytesPerSecond(bytes, decimals = 1) {
  if (bytes === 0) return '0 B/s';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Format percentage utility function
function formatPercent(value, decimals = 1) {
  return value.toFixed(decimals) + '%';
}

// Debounce function for performance
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for performance
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Color utilities for themes
const colorUtils = {
  // Get CSS variable value
  getCSSVariable(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name).trim();
  },
  
  // Set CSS variable value
  setCSSVariable(name, value) {
    document.documentElement.style.setProperty(name, value);
  },
  
  // Get theme-appropriate color
  getThemeColor(colorName) {
    const isDark = document.body.classList.contains('theme-dark');
    const themePrefix = isDark ? '--' : '--';
    return this.getCSSVariable(`${themePrefix}${colorName}`);
  }
};

// Animation utilities
const animationUtils = {
  // Animate number changes
  animateNumber(element, start, end, duration = 1000, callback = null) {
    const startTime = performance.now();
    const difference = end - start;
    
    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (difference * easeOut);
      
      if (element && typeof element.textContent !== 'undefined') {
        element.textContent = current.toFixed(1);
      }
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else if (callback) {
        callback();
      }
    };
    
    requestAnimationFrame(step);
  },
  
  // Pulse animation for status indicators
  pulseElement(element, duration = 2000) {
    if (!element) return;
    
    element.style.animation = `pulse ${duration}ms ease-in-out infinite`;
  },
  
  // Remove pulse animation
  removePulse(element) {
    if (!element) return;
    element.style.animation = '';
  }
};

// Error handling utilities
const errorUtils = {
  // Show error message in UI
  showError(message, container = null) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    if (container) {
      container.appendChild(errorDiv);
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.parentNode.removeChild(errorDiv);
        }
      }, 5000);
    } else {
      console.error('PMon Error:', message);
    }
  },
  
  // Clear error messages
  clearErrors(container) {
    const errors = container.querySelectorAll('.error-message');
    errors.forEach(error => error.remove());
  }
};

// Performance monitoring utilities
const perfUtils = {
  marks: new Map(),
  
  // Start performance measurement
  mark(name) {
    this.marks.set(name, performance.now());
  },
  
  // End performance measurement and log result
  measure(name, log = false) {
    const startTime = this.marks.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.marks.delete(name);
      
      if (log) {
        console.log(`${name}: ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    }
    return 0;
  }
};

// Local storage utilities
const storageUtils = {
  // Get item with fallback
  get(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.warn('Error reading from localStorage:', error);
      return fallback;
    }
  },
  
  // Set item
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Error writing to localStorage:', error);
      return false;
    }
  },
  
  // Remove item
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Error removing from localStorage:', error);
      return false;
    }
  }
};

// Export utilities to global scope
window.utils = {
  formatBytes,
  formatBytesPerSecond,
  formatPercent,
  debounce,
  throttle,
  colorUtils,
  animationUtils,
  errorUtils,
  perfUtils,
  storageUtils
};

// Custom event system for components
class EventBus {
  constructor() {
    this.events = {};
  }
  
  // Subscribe to event
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  // Unsubscribe from event
  off(event, callback) {
    if (!this.events[event]) return;
    
    const index = this.events[event].indexOf(callback);
    if (index > -1) {
      this.events[event].splice(index, 1);
    }
  }
  
  // Emit event
  emit(event, data) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in event callback:', error);
      }
    });
  }
}

// Global event bus instance
window.eventBus = new EventBus();

// Component loading state manager
class LoadingStateManager {
  constructor() {
    this.loadingElements = new Set();
  }
  
  // Show loading state
  show(element, message = 'Loading...') {
    if (!element) return;
    
    element.classList.add('loading');
    element.setAttribute('data-loading-message', message);
    this.loadingElements.add(element);
  }
  
  // Hide loading state
  hide(element) {
    if (!element) return;
    
    element.classList.remove('loading');
    element.removeAttribute('data-loading-message');
    this.loadingElements.delete(element);
  }
  
  // Hide all loading states
  hideAll() {
    this.loadingElements.forEach(element => {
      this.hide(element);
    });
  }
}

// Global loading state manager
window.loadingManager = new LoadingStateManager();

console.log('Components and utilities loaded');
