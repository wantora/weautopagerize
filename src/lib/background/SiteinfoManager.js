import Prefs from "./Prefs";
import SiteinfoCache from "./SiteinfoCache";

function buildSiteinfo(siteinfo) {
  if (!Array.isArray(siteinfo)) {
    return [];
  }
  
  const newSiteinfo = [];
  
  siteinfo.forEach((info) => {
    if (
      info &&
      typeof info.url === "string" &&
      typeof info.nextLink === "string" &&
      typeof info.pageElement === "string" &&
      (info.insertBefore === undefined || info.insertBefore === null || typeof info.insertBefore === "string")
    ) {
      try {
        newSiteinfo.push({
          urlRegExp: new RegExp(info.url),
          nextLink: info.nextLink,
          pageElement: info.pageElement,
          insertBefore: info.insertBefore === undefined ? null : info.insertBefore,
        });
      } catch (error) {
        console.error(error); // eslint-disable-line no-console
      }
    }
  });
  
  return newSiteinfo;
}

const MICROFORMAT = buildSiteinfo([
  {
    url: "^https?://",
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
  _updateSiteinfo(siteinfoList) {
    this._siteinfoCache.clean(siteinfoList);
    
    return Promise.all(siteinfoList.map((url) => {
      const cacheData = this._siteinfoCache.get(url);
      
      if (cacheData) {
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
      this._siteinfo = buildSiteinfo([].concat(...jsons).map((d) => d.data));
    });
  }
  _updateUserSiteinfo(userSiteinfo) {
    this._userSiteinfo = [];
    
    if (userSiteinfo.trim() === "") {
      return;
    }
    
    try {
      const siteinfo = JSON.parse(userSiteinfo);
      this._userSiteinfo = buildSiteinfo(siteinfo);
    } catch (error) {
      console.error(error); // eslint-disable-line no-console
    }
  }
}
