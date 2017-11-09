import SiteinfoManager from "./lib/background/SiteinfoManager";
import ExcludeList from "./lib/background/ExcludeList";

const siteinfoManager = new SiteinfoManager();
const excludeList = new ExcludeList();

siteinfoManager.init();
excludeList.init();

browser.runtime.onMessage.addListener((message) => {
  if (!message) { return null; }
  
  if (message.type === "getSiteinfo") {
    if (excludeList.check(message.url)) {
      return Promise.resolve([]);
    } else {
      return Promise.resolve(siteinfoManager.getSiteinfo(message.url));
    }
  }
  
  return null;
});
