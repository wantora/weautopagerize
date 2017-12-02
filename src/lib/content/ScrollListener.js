export default class ScrollListener {
  constructor(callback) {
    this._callback = callback;
    
    let timeoutId = null;
    this._listener = () => {
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
  }
  disable() {
    window.removeEventListener("scroll", this._listener, {passive: true});
    window.removeEventListener("resize", this._listener, {passive: true});
  }
}
