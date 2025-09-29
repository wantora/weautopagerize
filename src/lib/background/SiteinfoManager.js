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
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

export default class SiteinfoManager {
  #siteinfo = [];
  #siteinfoURL = "";
  #siteinfoUpdateTime = 0;
  #userSiteinfo = [];

  async init() {
    await this.#updateSiteinfo();

    setInterval(
      async () => {
        await this.#updateSiteinfo();
      },
      60 * 60 * 1000
    );

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
    let siteinfoStatus = {
      name: null,
      count: this.#siteinfo.length,
      updateTime: null,
    };

    if (this.#siteinfoURL === "") {
      siteinfoStatus.name = browser.i18n.getMessage(
        "options_siteinfoLocal_label"
      );
    } else {
      siteinfoStatus.name = this.#siteinfoURL;
      siteinfoStatus.updateTime = new Date(
        this.#siteinfoUpdateTime
      ).toLocaleString([], {
        hour12: false,
      });
    }

    return [
      siteinfoStatus,
      {
        name: browser.i18n.getMessage("options_userSiteinfo_label"),
        count: this.#userSiteinfo.length,
        updateTime: null,
      },
    ];
  }
  async forceUpdateSiteinfo() {
    const {siteinfoData} = await Prefs.get(["siteinfoData"]);
    siteinfoData.updateTime = 0;
    await Prefs.set({siteinfoData});

    await this.#updateSiteinfo();
  }
  async #updateSiteinfo() {
    const {siteinfoURL, siteinfoData} = await Prefs.get([
      "siteinfoURL",
      "siteinfoData",
    ]);

    if (siteinfoURL !== siteinfoData.url) {
      siteinfoData.url = siteinfoURL;
      siteinfoData.updateTime = 0;
      siteinfoData.body = "[]";
    }

    if (siteinfoURL === "") {
      siteinfoData.body = await (
        await fetch(browser.runtime.getURL("wedata-items.json"))
      ).text();
    } else if (Date.now() >= siteinfoData.updateTime + CACHE_MAX_AGE) {
      siteinfoData.updateTime = Date.now();

      try {
        siteinfoData.body = await (
          await fetch(siteinfoURL, {
            redirect: "follow",
            cache: "no-cache",
          })
        ).text();
      } catch (error) {
        console.error(error);
      }
    }

    await Prefs.set({siteinfoData});

    let data = [];
    try {
      data = JSON.parse(siteinfoData.body);
    } catch (error) {
      console.error(error);
    }

    const ary = buildSiteinfo(data).map((value, index) => ({
      value,
      index,
      key: value.url.length,
    }));

    ary.sort((a, b) => {
      return b.key - a.key || a.index - b.index;
    });

    this.#siteinfo = ary.map(({value}) => value);
    this.#siteinfoURL = siteinfoURL;
    this.#siteinfoUpdateTime = siteinfoData.updateTime;
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
