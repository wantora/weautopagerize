import SiteinfoManager from "./lib/background/SiteinfoManager";
import ExcludeList from "./lib/background/ExcludeList";

const siteinfoManager = new SiteinfoManager();
const excludeList = new ExcludeList();

siteinfoManager.init();
excludeList.init();

browser.runtime.onMessage.addListener((message, sender) => {
  if (!message) { return null; }
  
  if (message.type === "getSiteinfo") {
    if (excludeList.check(message.url)) {
      return Promise.resolve(null);
    } else {
      return Promise.resolve(siteinfoManager.getSiteinfo(message.url));
    }
  } else if (message.type === "updateStatus") {
    if (sender.tab) {
      browser.browserAction.setIcon({
        path: `button.svg#${message.status}`,
        tabId: sender.tab.id,
      });
    }
  }
  
  return null;
});
