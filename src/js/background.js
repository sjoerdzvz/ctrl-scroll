/**
 * Zzinnovate: Command+Scroll Zoom
 * Background Service - Zoom Bridge
 * 
 * Mediates between content scripts and browser zoom API
 * Manages persistent per-domain zoom levels
 */

class ZoomBridge {
  constructor() {
    this.messageTypes = {
      GET_ZOOM: 'getZoom',
      SET_ZOOM: 'setZoom'
    };
    
    this.storagePrefixes = {
      DOMAIN_ZOOM: 'domain_zoom:'
    };
    
    this.setupMessageHandling();
  }
  
  /**
   * Register message handler with Chrome
   */
  setupMessageHandling() {
    chrome.runtime.onMessage.addListener(
      (request, sender, sendResponse) => {
        this.routeMessage(request, sender, sendResponse);
      }
    );
  }
  
  /**
   * Route incoming messages to appropriate handlers
   */
  routeMessage(request, sender, sendResponse) {
    const tabId = sender?.tab?.id;
    
    if (!tabId) {
      console.warn('[ZoomBridge] No tab ID in message sender');
      return;
    }
    
    switch (request.action) {
      case this.messageTypes.GET_ZOOM:
        this.retrieveZoom(tabId, sendResponse);
        break;
        
      case this.messageTypes.SET_ZOOM:
        this.persistZoom(tabId, request, sendResponse);
        break;
        
      default:
        console.warn('[ZoomBridge] Unknown action:', request.action);
    }
  }
  
  /**
   * Retrieve zoom level from browser
   */
  retrieveZoom(tabId, sendResponse) {
    chrome.tabs.getZoom(tabId, (zoomLevel) => {
      const normalized = typeof zoomLevel === 'number' ? zoomLevel : 1.0;
      sendResponse({ zoomLevel: normalized });
    });
  }
  
  /**
   * Apply zoom to tab and save to storage if domain provided
   */
  persistZoom(tabId, request, sendResponse) {
    const { zoomLevel, domain } = request;
    
    // Validate zoom level
    if (typeof zoomLevel !== 'number' || zoomLevel < 0.1 || zoomLevel > 5) {
      console.warn('[ZoomBridge] Invalid zoom level:', zoomLevel);
      sendResponse({ success: false });
      return;
    }
    
    // Apply to browser
    chrome.tabs.setZoom(tabId, zoomLevel, () => {
      const hasError = !!chrome.runtime.lastError;
      
      if (!hasError && domain) {
        // Save to persistent storage
        this.saveToStorage(domain, zoomLevel);
      }
      
      sendResponse({ success: !hasError });
    });
  }
  
  /**
   * Save zoom level for a domain to local storage (no write quota).
   * User settings use storage.sync; per-domain zoom uses storage.local.
   */
  saveToStorage(domain, zoomLevel) {
    const storageKey = `${this.storagePrefixes.DOMAIN_ZOOM}${domain}`;

    chrome.storage.local.set({ [storageKey]: zoomLevel }, () => {
      if (chrome.runtime.lastError) {
        console.error('[ZoomBridge] Storage local failed:', chrome.runtime.lastError);
      }
    });
  }
}

// Initialize the zoom bridge when service worker starts
const zoomBridge = new ZoomBridge();

