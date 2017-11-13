import {EventEmitter} from "events";

class PageInfo {
  constructor() {
    this._data = {
      state: null,
      siteinfo: null,
      insertPages: [], // [{url, pageNo}]
      userActive: true,
    };
    this._listenerInitialized = false;
    this._portInitialized = false;
    this._ports = new Set();
    this._emitter = new EventEmitter();
  }
  get data() {
    return this._data;
  }
  get emitter() {
    return this._emitter;
  }
  update(data) {
    for (const [key, value] of Object.entries(data)) {
      const oldValue = this._data[key];
      this._data[key] = value;
      this._emitter.emit(key, value, oldValue);
    }
    
    if ("state" in data || "userActive" in data) {
      const state = this._data.userActive ? this._data.state : "disable";
      this._setButtonState(state);
      if (state !== "default") {
        this._initListener();
      }
    }
    
    this._initPort();
    this._postPort();
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
  _initPort() {
    if (this._portInitialized) {
      return;
    }
    this._portInitialized = true;
    
    browser.runtime.onConnect.addListener((port) => {
      if (port.name !== "pageInfoPort") {
        return;
      }
      
      this._ports.add(port);
      port.postMessage(this._data);
      
      port.onMessage.addListener((data) => {
        this.update(data);
      });
      port.onDisconnect.addListener(() => {
        this._ports.delete(port);
      });
    });
  }
  _postPort() {
    for (const port of this._ports) {
      port.postMessage(this._data);
    }
  }
  _setButtonState(state) {
    browser.runtime.sendMessage({type: "setButtonState", value: state});
  }
}

export default new PageInfo();
