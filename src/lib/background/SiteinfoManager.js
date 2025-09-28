import Prefs from "./Prefs";
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
  #siteinfo = [];
  #userSiteinfo = [];

  async init() {
    await this.#loadSiteinfo();

    const {userSiteinfo} = await Prefs.get(["userSiteinfo"]);
    this.#updateUserSiteinfo(userSiteinfo);

    Prefs.on("userSiteinfo", (newValue) => {
      this.#updateUserSiteinfo(newValue);
    });
  }
  getSiteinfo(urlStr) {
    const newSiteinfo = [];

    for (const info of this.#userSiteinfo) {
      if (info.urlRegExp.test(urlStr)) {
        newSiteinfo.push(info);
      }
    }
    for (const info of this.#siteinfo) {
      if (info.urlRegExp.test(urlStr)) {
        newSiteinfo.push(info);
      }
    }
    newSiteinfo.push(...MICROFORMAT);

    return newSiteinfo;
  }
  getStatus() {
    return [
      {name: "internal", count: this.#siteinfo.length},
      {name: "user", count: this.#userSiteinfo.length},
    ];
  }
  async #loadSiteinfo() {
    const localData = await (
      await fetch(browser.runtime.getURL("wedata-items.json"))
    ).json();

    const ary = buildSiteinfo(localData).map((value, index) => ({
      value,
      index,
      key: value.url.length,
    }));

    ary.sort((a, b) => {
      return b.key - a.key || a.index - b.index;
    });

    this.#siteinfo = ary.map(({value}) => value);
  }
  #updateUserSiteinfo(userSiteinfo) {
    this.#userSiteinfo = [];

    try {
      this.#userSiteinfo = buildSiteinfo(parseUserSiteinfo(userSiteinfo));
    } catch (error) {
      console.error(error);
    }
  }
}
