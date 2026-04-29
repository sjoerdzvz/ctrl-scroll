/**
 * Zzinnovate: Command+Scroll Zoom
 * Settings Page - Configuration Manager
 * 
 * UI controller for zoom settings with real-time updates
 */

// Detect platform for smart defaults
const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

const DEFAULTS = Object.freeze({
  minZoom: 0.5,
  maxZoom: 3.0,
  step: 0.1,
  smoothing: 0.35,
  modifierKey: isMac ? 'metaKey' : 'ctrlKey',  // Cmd on Mac, Ctrl everywhere else
  rememberZoom: true
});

const CONSTRAINTS = Object.freeze({
  minZoomRange: [0.1, 1.0],
  maxZoomRange: [1.0, 5.0],
  stepRange: [0.01, 0.5],
  smoothingRange: [0.0, 1.0]
});

class SettingsManager {
  constructor() {
    this.dom = this.cacheElements();
    this.current = {};
    
    this.registerListeners();
    this.loadSettings();
  }
  
  /**
   * Cache DOM elements for performance
   */
  cacheElements() {
    return {
      form: document.getElementById('settingsForm'),
      statusBox: document.getElementById('status'),
      resetBtn: document.getElementById('resetBtn'),
      
      inputs: {
        minZoom: document.getElementById('minZoom'),
        maxZoom: document.getElementById('maxZoom'),
        step: document.getElementById('step'),
        smoothing: document.getElementById('smoothing'),
        modifierKey: document.querySelectorAll('input[name="modifierKey"]'),
        rememberZoom: document.getElementById('rememberZoom')
      },
      
      displays: {
        minZoom: document.getElementById('minZoomValue'),
        maxZoom: document.getElementById('maxZoomValue'),
        step: document.getElementById('stepValue'),
        smoothing: document.getElementById('smoothingValue')
      }
    };
  }
  
  /**
   * Bind all event listeners
   */
  registerListeners() {
    // Form submission
    this.dom.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSave();
    });
    
    // Reset button
    this.dom.resetBtn.addEventListener('click', () => this.handleReset());
    
    // Live value updates on input
    ['minZoom', 'maxZoom', 'step', 'smoothing', 'rememberZoom'].forEach(key => {
      const input = this.dom.inputs[key];
      if (input) {
        input.addEventListener('input', () => this.updateDisplayValues());
      }
    });
    
    // Modifier key radio buttons
    this.dom.inputs.modifierKey.forEach(radio => {
      radio.addEventListener('change', () => this.updateDisplayValues());
    });
  }
  
  /**
   * Load settings from storage and update UI
   */
  loadSettings() {
    chrome.storage.sync.get(DEFAULTS, (data) => {
      this.current = data;
      this.renderUI();
    });
  }
  
  /**
   * Render settings into form controls
   */
  renderUI() {
    this.dom.inputs.minZoom.value = Math.round(this.current.minZoom * 100);
    this.dom.inputs.maxZoom.value = Math.round(this.current.maxZoom * 100);
    this.dom.inputs.step.value = Math.round(this.current.step * 100);
    this.dom.inputs.smoothing.value = Math.round(this.current.smoothing * 100);
    this.dom.inputs.rememberZoom.checked = this.current.rememberZoom;
    
    // Set the correct modifier key radio button
    this.dom.inputs.modifierKey.forEach(radio => {
      radio.checked = radio.value === this.current.modifierKey;
    });
    
    this.updateDisplayValues();
  }
  
  /**
   * Update live display values
   */
  updateDisplayValues() {
    this.dom.displays.minZoom.textContent = this.dom.inputs.minZoom.value;
    this.dom.displays.maxZoom.textContent = this.dom.inputs.maxZoom.value;
    this.dom.displays.step.textContent = this.dom.inputs.step.value;
    this.dom.displays.smoothing.textContent = this.dom.inputs.smoothing.value;
  }
  
  /**
   * Collect and validate form data
   */
  collectFormData() {
    // Get selected modifier key
    const selectedModifier = Array.from(this.dom.inputs.modifierKey).find(
      radio => radio.checked
    )?.value || 'ctrlKey';
    
    const payload = {
      minZoom: parseInt(this.dom.inputs.minZoom.value) / 100,
      maxZoom: parseInt(this.dom.inputs.maxZoom.value) / 100,
      step: parseInt(this.dom.inputs.step.value) / 100,
      smoothing: parseInt(this.dom.inputs.smoothing.value) / 100,
      modifierKey: selectedModifier,
      rememberZoom: this.dom.inputs.rememberZoom.checked
    };
    
    return this.validateSettings(payload);
  }
  
  /**
   * Validate settings constraints
   */
  validateSettings(settings) {
    const errors = [];
    
    if (settings.minZoom >= settings.maxZoom) {
      errors.push('Minimum must be less than maximum');
    }
    
    if (settings.step <= 0 || settings.step > 0.5) {
      errors.push('Step must be between 1% and 50%');
    }
    
    if (settings.smoothing < 0 || settings.smoothing > 1) {
      errors.push('Smoothing must be between 0% and 100%');
    }
    
    return {
      valid: errors.length === 0,
      settings: settings,
      errors: errors
    };
  }
  
  /**
   * Save settings and notify all tabs
   */
  handleSave() {
    const validation = this.collectFormData();
    
    if (!validation.valid) {
      this.showMessage(validation.errors.join(', '), false);
      return;
    }
    
    chrome.storage.sync.set(validation.settings, () => {
      this.current = validation.settings;
      this.showMessage('✓ Settings saved!', true);
      
      // Broadcast to all content scripts
      this.notifyAllTabs(validation.settings);
    });
  }
  
  /**
   * Handle reset to defaults
   */
  handleReset() {
    if (!confirm('Reset all settings to defaults?')) return;
    
    chrome.storage.sync.set(DEFAULTS, () => {
      this.current = DEFAULTS;
      this.renderUI();
      this.showMessage('✓ Reset to defaults!', true);
      this.notifyAllTabs(DEFAULTS);
    });
  }
  
  /**
   * Display status message to user
   */
  showMessage(text, isSuccess) {
    this.dom.statusBox.textContent = text;
    this.dom.statusBox.className = isSuccess ? 'success' : 'error';
    this.dom.statusBox.style.display = 'block';
    
    setTimeout(() => {
      this.dom.statusBox.style.display = 'none';
    }, 2500);
  }
  
  /**
   * Send settings update to all open tabs
   */
  notifyAllTabs(settings) {
    chrome.tabs.query({}, (tabs) => {
      const message = {
        action: 'settingsChanged',
        settings: settings
      };
      
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {
          // Silently ignore if tab has no content script
        });
      });
    });
  }
}

// Initialize settings manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SettingsManager();
});

