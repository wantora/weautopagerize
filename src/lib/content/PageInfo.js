class PageInfo {
  constructor() {
    this._data = {
      state: null,
      siteinfo: null,
      insertPages: [], // [{url, pageNo}]
    };
    this._listenerInitialized = false;
    this._ports = new Set();
    
    browser.runtime.onConnect.addListener((port) => {
      if (port.name !== "pageInfoPort") { return; }
      
      this._ports.add(port);
      port.postMessage(this._data);
      port.onDisconnect.addListener((p) => {
        this._ports.delete(p);
      });
    });
  }
  update(data) {
    for (const [key, value] of Object.entries(data)) {
      this._data[key] = value;
    }
    
    if (this._data.state) {
      this._setButtonState(this._data.state);
      
      if (this._data.state !== "default") {
        this._initListener();
      }
    }
    
    for (const port of this._ports) {
      port.postMessage(this._data);
    }
  }
  appendInsertPage(insertPage) {
    this._data.insertPages.push(insertPage);
  }
  _initListener() {
    if (this._listenerInitialized) {
      return;
    }
    this._listenerInitialized = true;
    
    window.addEventListener("pagehide", () => {
      this._setButtonState("default");
    }, true);
    
    window.addEventListener("pageshow", () => {
      this.update(this._data);
    }, true);
  }
  _setButtonState(state) {
    browser.runtime.sendMessage({type: "setButtonState", value: state});
  }
}

export default new PageInfo();
