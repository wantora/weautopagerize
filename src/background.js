import SiteinfoManager from "./lib/background/SiteinfoManager";
import ExcludeList from "./lib/background/ExcludeList";
import SyncPrefs from "./lib/background/SyncPrefs";
import ButtonManager from "./lib/background/ButtonManager";

(async () => {
  try {
    const siteinfoManager = new SiteinfoManager();
    const excludeList = new ExcludeList();
    const syncPrefs = new SyncPrefs(["openLinkInNewTab"]);
    const buttonManager = new ButtonManager();

    await Promise.all([siteinfoManager.init(), excludeList.init(), syncPrefs.init()]);

    browser.runtime.onMessage.addListener(async (message, sender) => {
      if (message) {
        if (message.type === "getData") {
          const urlStr = message.value;
          const data = {
            userActive: !excludeList.check(urlStr),
            siteinfo: siteinfoManager.getSiteinfo(urlStr),
            prefs: {
              openLinkInNewTab: syncPrefs.get("openLinkInNewTab"),
            },
          };
          return data;
        } else if (message.type === "setButtonState") {
          if (sender.tab) {
            return buttonManager.setState(sender.tab.id, message.value);
          }
        } else if (message.type === "forceUpdateSiteinfo") {
          return siteinfoManager.forceUpdateSiteinfo();
        }
      }
      return null;
    });
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
  }
})();
