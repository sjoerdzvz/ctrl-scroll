/**
 * Zzinnovate: Command+Scroll Zoom
 * Content Script — ZoomController
 *
 * Depends on: zoom-utils.js (ZoomUtils, ScrollInputResolver, ZoomAnimator)
 */

class ZoomController {
  #config = {
    modifierKey: 'metaKey',
    zoomStep: 0.05,
    animationSmoothing: 0.35,
    minZoom: 0.5,
    maxZoom: 2.0,
    persistZoomPerDomain: true,
    invertScroll: false
  };

  #domain;
  #input;
  #animator;

  constructor() {
    this.#domain   = this.#extractDomain();
    this.#input    = new ScrollInputResolver();
    this.#animator = new ZoomAnimator(
      zoom => this.#sendZoom(zoom, null),
      zoom => this.#sendZoom(zoom, this.#config.persistZoomPerDomain ? this.#domain : null)
    );
    this.#init();
  }

  #extractDomain() {
    try {
      return new URL(window.location.href).hostname || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async #init() {
    try {
      const stored = await ZoomUtils.loadStorage(this.#config);
      this.#config = {
        ...this.#config,
        ...stored,
        invertScroll: stored.invertScroll ?? stored.invertMouse ?? stored.invertTrackpad ?? this.#config.invertScroll
      };
      this.#animator.smoothing = this.#config.animationSmoothing;

      await this.#restoreZoom();
      this.#attachListeners();
    } catch (err) {
      console.error('[ZoomController] Init failed:', err);
    }
  }

  async #restoreZoom() {
    const browserZoom = await this.#loadBrowserZoom();
    let raw;

    if (this.#config.persistZoomPerDomain) {
      raw = await this.#loadDomainZoom();
      if (raw == null) raw = browserZoom;
    } else {
      raw = browserZoom;
    }

    const zoom = ZoomUtils.constrain(
      ZoomUtils.snap(raw ?? 1.0),
      this.#config.minZoom,
      this.#config.maxZoom
    );

    this.#animator.sync(zoom);

    const currentZoom = ZoomUtils.constrain(
      ZoomUtils.snap(browserZoom ?? 1.0),
      this.#config.minZoom,
      this.#config.maxZoom
    );

    if (raw != null && Math.abs(currentZoom - zoom) >= 0.001) {
      this.#sendZoom(zoom, null);
    }
  }

  #loadBrowserZoom() {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'getZoom' }, r => resolve(r?.zoomLevel ?? null));
    });
  }

  #loadDomainZoom() {
    const key = `domain_zoom:${this.#domain}`;
    return new Promise(resolve => {
      chrome.storage.local.get([key], localData => resolve(localData[key] ?? null));
    });
  }

  #attachListeners() {
    document.addEventListener('wheel', e => this.#onWheel(e), { passive: false });
    chrome.runtime.onMessage.addListener((msg, _, reply) => this.#onMessage(msg, reply));
  }

  #onWheel(event) {
    if (!event[this.#config.modifierKey]) return;
    event.preventDefault();

    const direction = this.#input.resolve(event, this.#config.invertScroll);
    const raw  = this.#animator.target + direction * this.#config.zoomStep;
    const zoom = ZoomUtils.constrain(
      ZoomUtils.snap(raw),
      this.#config.minZoom,
      this.#config.maxZoom
    );

    this.#animator.setTarget(zoom);
  }

  #sendZoom(zoomLevel, domain) {
    chrome.runtime.sendMessage({ action: 'setZoom', zoomLevel, domain });
  }

  #onMessage(message, sendResponse) {
    if (message.action === 'settingsChanged') {
      this.#config = { ...this.#config, ...message.settings };
      this.#animator.smoothing = this.#config.animationSmoothing;
      this.#input.reset();
      sendResponse({ status: 'acknowledged' });
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ZoomController());
} else {
  new ZoomController();
}
