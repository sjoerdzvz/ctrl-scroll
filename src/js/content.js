/**
 * Zzinnovate: Command+Scroll Zoom
 * Content Script - Zoom Controller
 * 
 * Handles zoom interactions on web pages using keyboard modifiers + scroll
 * Intelligently remembers zoom per domain with cloud sync
 */

// Detect platform for smart defaults
const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

class ZoomController {
  constructor() {
    this.config = {
      minZoom: 0.5,
      maxZoom: 3.0,
      zoomStep: 0.1,
      animationSmoothing: 0.35,
      modifierKey: isMac ? 'metaKey' : 'ctrlKey',  // Cmd on Mac, Ctrl elsewhere
      persistZoomPerDomain: true
    };
    
    this.state = {
      activeZoom: 1.0,
      targetZoom: 1.0,
      isAnimating: false,
      isReady: false
    };
    
    this.domain = this.extractDomain();
    
    this.initialize();
  }
  
  /**
   * Extract domain from current URL
   */
  extractDomain() {
    try {
      const url = new URL(window.location.href);
      return url.hostname || url.origin;
    } catch (err) {
      console.warn('[ZoomController] Could not extract domain:', err);
      return 'unknown';
    }
  }
  
  /**
   * Load settings from chrome.storage and initialize
   */
  async initialize() {
    try {
      const stored = await this.loadStorageAsync(this.config);
      this.config = { ...this.config, ...stored };
      
      // Load per-domain zoom if enabled
      if (this.config.persistZoomPerDomain) {
        await this.restoreDomainZoom();
      } else {
        await this.restoreBrowserZoom();
      }
      
      this.attachEventListeners();
      this.state.isReady = true;
      
    } catch (err) {
      console.error('[ZoomController] Initialization failed:', err);
    }
  }
  
  /**
   * Promise wrapper for chrome.storage
   */
  loadStorageAsync(defaults) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(defaults, (items) => {
        resolve(items);
      });
    });
  }
  
  /**
   * Restore zoom level from browser
   */
  async restoreBrowserZoom() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getZoom' }, (response) => {
        if (response?.zoomLevel) {
          this.state.activeZoom = this.constrainZoom(response.zoomLevel);
          this.state.targetZoom = this.state.activeZoom;
        }
        resolve();
      });
    });
  }
  
  /**
   * Restore saved zoom for this specific domain
   */
  async restoreDomainZoom() {
    const storageKey = `domain_zoom:${this.domain}`;
    return new Promise((resolve) => {
      chrome.storage.sync.get([storageKey], (data) => {
        if (data[storageKey] !== undefined) {
          const saved = data[storageKey];
          this.state.activeZoom = this.constrainZoom(saved);
          this.state.targetZoom = this.state.activeZoom;
          this.applyZoom();
        } else {
          this.restoreBrowserZoom().then(resolve);
        }
        resolve();
      });
    });
  }
  
  /**
   * Constrain zoom value within configured bounds
   */
  constrainZoom(value) {
    return Math.max(this.config.minZoom, Math.min(this.config.maxZoom, value));
  }
  
  /**
   * Attach wheel event listener with non-passive flag
   */
  attachEventListeners() {
    document.addEventListener('wheel', (e) => this.handleZoomScroll(e), {
      passive: false
    });
    
    chrome.runtime.onMessage.addListener((msg, sender, reply) => {
      this.handleMessageFromBackground(msg, reply);
    });
  }
  
  /**
   * Handle zoom scroll events
   */
  handleZoomScroll(event) {
    // Check if modifier key is pressed
    if (!event[this.config.modifierKey]) return;
    
    event.preventDefault();
    
    // Determine direction and calculate new zoom
    const direction = event.deltaY > 0 ? -1 : 1;
    const newZoom = this.state.targetZoom + (direction * this.config.zoomStep);
    this.state.targetZoom = this.constrainZoom(newZoom);
    
    // Begin animation if not already animating
    if (!this.state.isAnimating) {
      this.state.isAnimating = true;
      this.animate();
    }
  }
  
  /**
   * Smooth zoom animation using RAF
   */
  animate() {
    const diff = this.state.targetZoom - this.state.activeZoom;
    
    if (Math.abs(diff) < 0.001) {
      // Animation complete
      this.state.activeZoom = this.state.targetZoom;
      this.state.isAnimating = false;
      this.applyZoom();
      return;
    }
    
    // Apply easing
    this.state.activeZoom += diff * this.config.animationSmoothing;
    this.applyZoom();
    
    // Continue animation loop
    requestAnimationFrame(() => this.animate());
  }
  
  /**
   * Apply zoom level to browser and save
   */
  applyZoom() {
    const payload = {
      action: 'setZoom',
      zoomLevel: this.state.activeZoom,
      domain: this.config.persistZoomPerDomain ? this.domain : null
    };
    
    chrome.runtime.sendMessage(payload);
  }
  
  /**
   * Handle messages from background/options
   */
  handleMessageFromBackground(message, sendResponse) {
    if (message.action === 'settingsChanged') {
      this.config = { ...this.config, ...message.settings };
      sendResponse({ status: 'acknowledged' });
    }
  }
}

// Initialize the zoom controller when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ZoomController();
  });
} else {
  new ZoomController();
}


