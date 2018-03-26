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
    this._siteinfoCache = new SiteinfoCache();
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
      "siteinfoList",
      "userSiteinfo",
    ]).then(({siteinfoList, userSiteinfo}) => {
      this._updateSiteinfo(siteinfoList);
      this._updateUserSiteinfo(userSiteinfo);
    });
  }
  getSiteinfo(urlStr) {
    return [].concat(
      this._userSiteinfo.filter((info) => info.urlRegExp.test(urlStr)),
      this._siteinfo.filter((info) => info.urlRegExp.test(urlStr)),
      MICROFORMAT
    );
  }
  forceUpdateSiteinfo() {
    return Prefs.get(["siteinfoList"]).then(({siteinfoList}) => {
      return this._updateSiteinfo(siteinfoList, true);
    });
  }
  async _updateSiteinfo(siteinfoList, forceUpdate = false) {
    const jsons = await this._siteinfoCache.update({
      urls: siteinfoList,
      updateFn: (url) => {
        return fetch(url, {
          redirect: "follow",
          cache: forceUpdate ? "no-store" : "no-cache",
        }).then((res) => res.json());
      },
      forceUpdate: forceUpdate,
    });
    const ary = buildSiteinfo([].concat(...jsons))
      .map((value, index) => ({value, index, key: value.url.length}));
    
    ary.sort((a, b) => {
      return (b.key - a.key) || (a.index - b.index);
    });
    
    this._siteinfo = ary.map(({value}) => value);
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
