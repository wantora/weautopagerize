import SiteinfoManager from "./lib/background/SiteinfoManager";
import ExcludeList from "./lib/background/ExcludeList";
import Prefs from "./lib/background/Prefs";
import updateButtonState from "./lib/background/updateButtonState";

(async () => {
  try {
    const siteinfoManager = new SiteinfoManager();
    const excludeList = new ExcludeList();

    await Promise.all([siteinfoManager.init(), excludeList.init()]);

    browser.runtime.onMessage.addListener(async (message, sender) => {
      if (message) {
        if (message.type === "getData") {
          const prefs = await Prefs.get(["openLinkInNewTab", "addHistory"]);

          const urlStr = message.value;
          const data = {
            userActive: !excludeList.check(urlStr),
            siteinfo: siteinfoManager.getSiteinfo(urlStr),
            prefs: prefs,
          };
          return data;
        } else if (message.type === "setButtonState") {
          if (sender.tab) {
            return updateButtonState(sender.tab.id, message.value);
          }
        } else if (message.type === "forceUpdateSiteinfo") {
          return siteinfoManager.forceUpdateSiteinfo();
        } else if (message.type === "addBrowserHistory") {
          if (!sender.tab.incognito) {
            return browser.history.addUrl(message.value);
          }
        }
      }
      return null;
    });
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
  }
})();
