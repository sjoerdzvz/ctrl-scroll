/**
 * Zzinnovate: Command+Scroll Zoom
 * Utilities — ZoomUtils, ScrollInputResolver, ZoomAnimator
 */

// ─── ZoomUtils ────────────────────────────────────────────────────────────────

class ZoomUtils {
  static SNAP = 0.05; // Always snap to 5% increments

  /** Round a zoom value to the nearest 5% increment */
  static snap(value) {
    const snapped = Math.round(value / ZoomUtils.SNAP) * ZoomUtils.SNAP;
    return Math.round(snapped * 100) / 100;
  }

  /** Clamp a value between min and max */
  static constrain(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Heuristic: trackpad sends continuous pixel-mode (deltaMode=0) events
   * with small delta values. A regular mouse wheel sends large discrete deltas
   * or deltaMode=1 (line) / deltaMode=2 (page).
   */
  static isTrackpad(event) {
    return event.deltaMode === 0 && Math.abs(event.deltaY) < 50;
  }

  /** Promise wrapper for chrome.storage.sync.get */
  static loadStorage(defaults) {
    return new Promise(resolve => {
      chrome.storage.sync.get(defaults, items => resolve(items));
    });
  }
}

// ─── ScrollInputResolver ─────────────────────────────────────────────────────

class ScrollInputResolver {
  #accum = 0;
  static #THRESHOLD = 40; // pixels to accumulate before triggering a zoom step

  /**
   * Returns { direction: +1|-1, isTrackpad: boolean } or null.
   */
  resolve(event, invertMouse, invertTrackpad) {
    const isTrackpad = ZoomUtils.isTrackpad(event);
    let direction;

    if (isTrackpad) {
      this.#accum += event.deltaY;
      if (Math.abs(this.#accum) < ScrollInputResolver.#THRESHOLD) return null;
      direction = this.#accum < 0 ? 1 : -1;
      this.#accum = 0;
      return { direction: invertTrackpad ? -direction : direction, isTrackpad: true };
    } else {
      direction = event.deltaY > 0 ? -1 : 1;
      return { direction: invertMouse ? -direction : direction, isTrackpad: false };
    }
  }

  reset() {
    this.#accum = 0;
  }
}

// ─── ZoomAnimator ─────────────────────────────────────────────────────────────

class ZoomAnimator {
  #active = 1.0;
  #target = 1.0;
  #running = false;
  #lastApply = 0;
  #saveTimer = null;
  #smoothing = 0.35;

  static #THROTTLE  = 50;  // ms — limit intermediate browser calls to ~20fps
  static #DEBOUNCE  = 600; // ms — wait until scrolling stops before saving

  /**
   * @param {(zoomLevel: number) => void} onApply  — visual update (no storage)
   * @param {(zoomLevel: number) => void} onSave   — persist to storage
   */
  constructor(onApply, onSave) {
    this._onApply = onApply;
    this._onSave  = onSave;
  }

  get active() { return this.#active; }
  get target() { return this.#target; }

  set smoothing(v) { this.#smoothing = v; }

  /** Animate towards a new target zoom level */
  setTarget(value) {
    this.#target = value;
    if (!this.#running) {
      this.#running = true;
      this.#tick();
    }
  }

  /** Instantly sync to a zoom level (no animation, no save) */
  sync(value) {
    this.#active = value;
    this.#target = value;
  }

  #tick() {
    const diff = this.#target - this.#active;

    if (Math.abs(diff) < 0.001) {
      // Done — apply exact final value, then schedule a debounced save
      this.#active = this.#target;
      this.#running = false;
      this._onApply(this.#active);
      this.#scheduleSave();
      return;
    }

    // Easing step — only push to browser at throttled rate
    this.#active += diff * this.#smoothing;
    this.#throttledApply();
    requestAnimationFrame(() => this.#tick());
  }

  #throttledApply() {
    const now = Date.now();
    if (now - this.#lastApply < ZoomAnimator.#THROTTLE) return;
    this.#lastApply = now;
    this._onApply(this.#active);
  }

  #scheduleSave() {
    clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(
      () => this._onSave(this.#active),
      ZoomAnimator.#DEBOUNCE
    );
  }
}
