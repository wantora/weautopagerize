import events from "events";

class PageInfo {
  constructor() {
    this._data = {
      state: null,
      siteinfo: null,
      logList: [],
      logListKey: Date.now(),
      userActive: true,
      url: location.href,
    };
    this._listenerInitialized = false;
    this._portInitialized = false;
    this._ports = new Set();
    this._emitter = new events.EventEmitter();
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
      let state;
      if (this._data.state === "default") {
        state = "default";
      } else if (this._data.userActive) {
        state = this._data.state;
      } else {
        state = "disable";
      }

      this._setButtonState(state);
      if (state !== "default") {
        this._initListener();
      }
    }

    this._postPort();
  }
  log(data) {
    this._data.logList.push(Object.assign({time: Date.now()}, data));
    this._postPort();
  }
  logError(error) {
    console.error(error); // eslint-disable-line no-console
    this.log({type: "error", name: error.name, message: error.message});
  }
  _initListener() {
    if (this._listenerInitialized) {
      return;
    }
    this._listenerInitialized = true;

    window.addEventListener("pageshow", () => {
      this.update(this._data);
    });
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
      this._postPort();

      port.onMessage.addListener((data) => {
        this.update(data);
      });
      port.onDisconnect.addListener(() => {
        this._ports.delete(port);
      });
    });
  }
  _postPort() {
    this._initPort();

    for (const port of this._ports) {
      port.postMessage(this._data);
    }
  }
  _setButtonState(state) {
    browser.runtime.sendMessage({type: "setButtonState", value: state});
  }
}

export default new PageInfo();
