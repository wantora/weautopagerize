let globalScrolled = false;

export default class ScrollListener {
  constructor(callback) {
    this._callback = callback;

    let timeoutId = null;
    this._listener = (ev) => {
      if (!globalScrolled) {
        if (ev.type === "scroll") {
          globalScrolled = true;
        } else {
          return;
        }
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        timeoutId = null;
        this._callback.call(null);
      }, 200);
    };
  }
  enable() {
    window.addEventListener("scroll", this._listener, {passive: true});
    window.addEventListener("resize", this._listener, {passive: true});
    if (document.readyState !== "complete") {
      window.addEventListener("load", this._listener, {
        passive: true,
        once: true,
      });
    }
    if (globalScrolled) {
      this._callback.call(null);
    }
  }
  disable() {
    window.removeEventListener("scroll", this._listener, {passive: true});
    window.removeEventListener("resize", this._listener, {passive: true});
    window.removeEventListener("load", this._listener, {
      passive: true,
      once: true,
    });
  }
}
