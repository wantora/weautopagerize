export default class ScrollListener {
  constructor(callback) {
    this._callback = callback;
    this._listener = null;
  }
  enable() {
    if (this._listener) {
      return;
    }
    
    let timeoutID = null;
    this._listener = () => {
      if (timeoutID) {
        clearTimeout(timeoutID);
      }
      timeoutID = setTimeout(() => {
        timeoutID = null;
        this._callback.call(null);
      }, 200);
    };
    window.addEventListener("scroll", this._listener, {passive: true});
    window.addEventListener("resize", this._listener, {passive: true});
  }
  disable() {
    if (!this._listener) {
      return;
    }
    
    window.removeEventListener("scroll", this._listener, {passive: true});
    window.removeEventListener("resize", this._listener, {passive: true});
    this._listener = null;
  }
}
