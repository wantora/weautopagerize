import SiteinfoManager from "./lib/background/SiteinfoManager";
import ExcludeList from "./lib/background/ExcludeList";
import SyncPrefs from "./lib/background/SyncPrefs";
import ButtonManager from "./lib/background/ButtonManager";

const siteinfoManager = new SiteinfoManager();
const excludeList = new ExcludeList();
const syncPrefs = new SyncPrefs(["openLinkInNewTab"]);
const buttonManager = new ButtonManager();

siteinfoManager.init();
excludeList.init();
syncPrefs.init();
buttonManager.init();

browser.runtime.onMessage.addListener((message, sender) => {
  if (!message) { return null; }
  
  if (message.type === "getData") {
    const url = message.value;
    
    return Promise.resolve({
      exclude: excludeList.check(url),
      siteinfo: siteinfoManager.getSiteinfo(url),
      prefs: {
        openLinkInNewTab: syncPrefs.get("openLinkInNewTab"),
      },
    });
  } else if (message.type === "setButtonState") {
    if (sender.tab) {
      buttonManager.setState(sender.tab.id, message.value);
    }
  }
  
  return null;
});
