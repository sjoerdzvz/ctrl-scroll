/**
 * Zzinnovate: Command+Scroll Zoom
 * Settings Page - Configuration Manager
 *
 * UI controller for zoom settings with real-time updates
 */

const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

const DEFAULTS = Object.freeze({
  modifierKey: 'metaKey',
  zoomStep: 0.05,
  trackpadStepMultiplier: 0.5,
  animationSmoothing: 0.35,
  minZoom: 0.5,
  maxZoom: 2.0,
  persistZoomPerDomain: true,
  invertMouse: false,
  invertTrackpad: false
});

class SettingsManager {
  constructor() {
    this.dom = this.cacheElements();
    this.current = {};

    this.registerListeners();
    this.loadSettings();
  }

  cacheElements() {
    return {
      form: document.getElementById('settingsForm'),
      statusBox: document.getElementById('toast'),
      resetBtn: document.getElementById('resetBtn'),

      inputs: {
        modifierKey: document.querySelectorAll('input[name="modifierKey"]'),
        step: document.getElementById('step'),
        smoothing: document.getElementById('smoothing'),
        minZoom: document.getElementById('minZoom'),
        maxZoom: document.getElementById('maxZoom'),
        rememberZoom: document.getElementById('rememberZoom'),
        invertMouse: document.getElementById('invertMouse'),
        invertTrackpad: document.getElementById('invertTrackpad'),
        trackpadMultiplier: document.getElementById('trackpadMultiplier')
      },

      displays: {
        step: document.getElementById('stepValue'),
        smoothing: document.getElementById('smoothingValue'),
        minZoom: document.getElementById('minZoomValue'),
        maxZoom: document.getElementById('maxZoomValue'),
        trackpadMultiplier: document.getElementById('trackpadMultiplierValue')
      }
    };
  }

  registerListeners() {
    this.dom.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSave();
    });

    this.dom.resetBtn.addEventListener('click', () => this.handleReset());

    // Sliders: update display live only
    ['step', 'smoothing', 'minZoom', 'maxZoom', 'trackpadMultiplier'].forEach(key => {
      const input = this.dom.inputs[key];
      if (input) {
        input.addEventListener('input', () => this.updateDisplayValues());
      }
    });
  }

  loadSettings() {
    chrome.storage.sync.get(DEFAULTS, (data) => {
      this.current = data;
      this.renderUI();
    });
  }

  renderUI() {
    this.dom.inputs.step.value = Math.round(this.current.zoomStep * 100);
    this.dom.inputs.smoothing.value = Math.round(this.current.animationSmoothing * 100);
    this.dom.inputs.minZoom.value = Math.round(this.current.minZoom * 100);
    this.dom.inputs.maxZoom.value = Math.round(this.current.maxZoom * 100);
    this.dom.inputs.rememberZoom.checked = this.current.persistZoomPerDomain;
    this.dom.inputs.invertMouse.checked = this.current.invertMouse;
    this.dom.inputs.invertTrackpad.checked = this.current.invertTrackpad;
    this.dom.inputs.trackpadMultiplier.value = Math.round(this.current.trackpadStepMultiplier * 100);

    this.dom.inputs.modifierKey.forEach(radio => {
      radio.checked = radio.value === this.current.modifierKey;
    });

    this.updateDisplayValues();
  }

  updateDisplayValues() {
    this.dom.displays.step.textContent = this.dom.inputs.step.value;
    this.dom.displays.smoothing.textContent = this.dom.inputs.smoothing.value;
    this.dom.displays.minZoom.textContent = this.dom.inputs.minZoom.value;
    this.dom.displays.maxZoom.textContent = this.dom.inputs.maxZoom.value;
    this.dom.displays.trackpadMultiplier.textContent = this.dom.inputs.trackpadMultiplier.value;
  }

  collectFormData() {
    const selectedModifier = Array.from(this.dom.inputs.modifierKey).find(
      radio => radio.checked
    )?.value || 'metaKey';

    return {
      modifierKey: selectedModifier,
      zoomStep: parseInt(this.dom.inputs.step.value) / 100,
      animationSmoothing: parseInt(this.dom.inputs.smoothing.value) / 100,
      minZoom: parseInt(this.dom.inputs.minZoom.value) / 100,
      maxZoom: parseInt(this.dom.inputs.maxZoom.value) / 100,
      persistZoomPerDomain: this.dom.inputs.rememberZoom.checked,
      invertMouse: this.dom.inputs.invertMouse.checked,
      invertTrackpad: this.dom.inputs.invertTrackpad.checked,
      trackpadStepMultiplier: parseInt(this.dom.inputs.trackpadMultiplier.value) / 100
    };
  }

  validateSettings(settings) {
    const errors = [];

    if (settings.minZoom >= settings.maxZoom) {
      errors.push('Minimum must be less than maximum');
    }
    if (settings.zoomStep <= 0 || settings.zoomStep > 0.5) {
      errors.push('Step must be between 1% and 50%');
    }
    if (settings.animationSmoothing < 0 || settings.animationSmoothing > 1) {
      errors.push('Smoothing must be between 0% and 100%');
    }

    return { valid: errors.length === 0, errors };
  }

  handleSave() {
    const settings = this.collectFormData();
    const validation = this.validateSettings(settings);

    if (!validation.valid) {
      this.showMessage(validation.errors.join(', '), false);
      return;
    }

    chrome.storage.sync.set(settings, () => {
      this.current = settings;
      this.showMessage('✓ Settings saved!', true);
      this.notifyAllTabs(settings);
    });
  }

  handleReset() {
    if (!confirm('Reset all settings to defaults?')) return;

    chrome.storage.sync.set({ ...DEFAULTS }, () => {
      this.current = { ...DEFAULTS };
      this.renderUI();
      this.showMessage('✓ Reset to defaults!', true);
      this.notifyAllTabs(DEFAULTS);
    });
  }

  showMessage(text, isSuccess) {
    const toast = this.dom.statusBox;
    toast.textContent = text;
    toast.className = isSuccess ? 'success show' : 'error show';

    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  notifyAllTabs(settings) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { action: 'settingsChanged', settings }).catch(() => {});
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SettingsManager();
});
