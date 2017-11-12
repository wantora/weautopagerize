class PageInfo {
  constructor() {
    this._data = {};
    this._listenerInitialized = false;
  }
  update(data) {
    for (const [key, value] of Object.entries(data)) {
      this._data[key] = value;
    }
    
    if (this._data.state) {
      this._setState(this._data.state);
      
      if (this._data.state !== "default") {
        this._initListener();
      }
    }
  }
  _initListener() {
    if (this._listenerInitialized) {
      return;
    }
    this._listenerInitialized = true;
    
    window.addEventListener("pagehide", () => {
      this._setState("default");
    }, true);
    
    window.addEventListener("pageshow", () => {
      this.update(this._data);
    }, true);
  }
  _setState(state) {
    browser.runtime.sendMessage({type: "setState", value: state});
  }
}

export default new PageInfo();
