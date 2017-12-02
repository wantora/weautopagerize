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
    this._intervalId = null;
  }
  enable() {
    window.addEventListener("scroll", this._listener, {passive: true});
    window.addEventListener("resize", this._listener, {passive: true});
    clearInterval(this._intervalId);
    this._intervalId = setInterval(this._listener, 1000);
  }
  disable() {
    window.removeEventListener("scroll", this._listener, {passive: true});
    window.removeEventListener("resize", this._listener, {passive: true});
    clearInterval(this._intervalId);
  }
}
