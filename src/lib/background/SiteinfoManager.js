import Prefs from "./Prefs";
import SiteinfoCache from "./SiteinfoCache";
import parseUserSiteinfo from "../siteinfo/parseUserSiteinfo";
import buildSiteinfo from "../siteinfo/buildSiteinfo";

const MICROFORMAT = buildSiteinfo([
  {
    url: "^https?://.*$",
    nextLink: '//a[@rel="next"] | //link[@rel="next"]',
    pageElement: '//*[contains(@class, "autopagerize_page_element")]',
    insertBefore: '//*[contains(@class, "autopagerize_insert_before")]',
  },
]);

export default class SiteinfoManager {
  constructor() {
    this._siteinfo = [];
    this._userSiteinfo = [];
    this._siteinfoCache = null;
  }
  init() {
    Prefs.on("siteinfoList", (newValue) => {
      this._updateSiteinfo(newValue);
    });
    
    Prefs.on("userSiteinfo", (newValue) => {
      this._updateUserSiteinfo(newValue);
    });
    
    setInterval(() => {
      Prefs.get(["siteinfoList"]).then(({siteinfoList}) => {
        this._updateSiteinfo(siteinfoList);
      });
    }, 60 * 60 * 1000);
    
    return Prefs.get([
      "siteinfoCache",
      "siteinfoList",
      "userSiteinfo",
    ]).then(({siteinfoCache, siteinfoList, userSiteinfo}) => {
      this._siteinfoCache = new SiteinfoCache(siteinfoCache);
      this._updateSiteinfo(siteinfoList);
      this._updateUserSiteinfo(userSiteinfo);
    });
  }
  getSiteinfo(url) {
    const siteinfo = [];
    
    [
      this._userSiteinfo,
      this._siteinfo,
      MICROFORMAT,
    ].forEach((si) => {
      si.forEach((info) => {
        if (info.urlRegExp.test(url)) {
          siteinfo.push(info);
        }
      });
    });
    
    return siteinfo;
  }
  forceUpdateSiteinfo() {
    return Prefs.get(["siteinfoList"]).then(({siteinfoList}) => {
      return this._updateSiteinfo(siteinfoList, true);
    });
  }
  _updateSiteinfo(siteinfoList, forceUpdate = false) {
    this._siteinfoCache.clean(siteinfoList);
    
    return Promise.all(siteinfoList.map((url) => {
      const cacheData = this._siteinfoCache.get(url);
      
      if (!forceUpdate && cacheData) {
        return cacheData;
      } else {
        return fetch(url, {redirect: "follow"}).then((res) => res.json()).then((data) => {
          this._siteinfoCache.set(url, data);
          return data;
        }).catch((error) => {
          console.error(error); // eslint-disable-line no-console
          return this._siteinfoCache.get(url, true) || [];
        });
      }
    })).then((jsons) => {
      const ary = buildSiteinfo([].concat(...jsons))
        .map((value, index) => ({value, index, key: value.url.length}));
      
      ary.sort((a, b) => {
        return (b.key - a.key) || (a.index - b.index);
      });
      
      this._siteinfo = ary.map(({value}) => value);
    });
  }
  _updateUserSiteinfo(userSiteinfo) {
    this._userSiteinfo = [];
    
    try {
      this._userSiteinfo = buildSiteinfo(parseUserSiteinfo(userSiteinfo));
    } catch (error) {
      console.error(error); // eslint-disable-line no-console
    }
  }
}
