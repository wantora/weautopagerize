import {EventEmitter} from "events";

class Prefs {
  constructor(defaultKeys) {
    this._defaultKeys = defaultKeys;
    this._emitter = new EventEmitter();

    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "local") {
        Object.keys(changes).forEach((key) => {
          this._emitter.emit(key, changes[key].newValue, changes[key].oldValue);
        });
      }
    });
  }
  get(keysArray) {
    const keysObject = {};
    keysArray.forEach((key) => {
      keysObject[key] = this._defaultKeys[key];
    });
    return browser.storage.local.get(keysObject);
  }
  async set(keysObject) {
    await browser.storage.local.set(keysObject);
  }
  on(keyName, listener) {
    this._emitter.on(keyName, listener);
  }
  off(keyName, listener) {
    this._emitter.removeListener(keyName, listener);
  }
}

export default new Prefs({
  siteinfoList: ["http://wedata.net/databases/AutoPagerize/items_all.json"],
  siteinfoCache: {},
  userSiteinfo: "",
  excludeList: [],
  openLinkInNewTab: true,
});
