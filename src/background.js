import SiteinfoManager from "./lib/background/SiteinfoManager";
import ExcludeList from "./lib/background/ExcludeList";
import ButtonManager from "./lib/background/ButtonManager";

const siteinfoManager = new SiteinfoManager();
const excludeList = new ExcludeList();
const buttonManager = new ButtonManager();

siteinfoManager.init();
excludeList.init();
buttonManager.init();

browser.runtime.onMessage.addListener((message, sender) => {
  if (!message) { return null; }
  
  if (message.type === "getSiteinfo") {
    const url = message.value;
    if (excludeList.check(url)) {
      return Promise.resolve(null);
    } else {
      return Promise.resolve(siteinfoManager.getSiteinfo(url));
    }
  } else if (message.type === "setState") {
    if (sender.tab) {
      buttonManager.setState(sender.tab.id, message.value);
    }
  }
  
  return null;
});
