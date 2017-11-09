import Prefs from "./Prefs";

const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

export default class SiteinfoCache {
  constructor(siteinfoCache) {
    this._siteinfoCache = siteinfoCache;
  }
  get(url, ignoreExpires = false) {
    const cache = this._siteinfoCache[url];
    if (cache && (ignoreExpires || Date.now() < cache.time + CACHE_MAX_AGE)) {
      return cache.data;
    } else {
      return null;
    }
  }
  set(url, data) {
    this._siteinfoCache[url] = {
      data: data,
      time: Date.now(),
    };
    
    return Prefs.set({siteinfoCache: this._siteinfoCache});
  }
  clean(urls) {
    let updateFlag = false;
    
    Object.keys(this._siteinfoCache).forEach((key) => {
      if (!urls.includes(key)) {
        delete this._siteinfoCache[key];
        updateFlag = true;
      }
    });
    
    if (updateFlag) {
      Prefs.set({siteinfoCache: this._siteinfoCache});
    }
  }
}
