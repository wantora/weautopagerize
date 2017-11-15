import PageInfo from "./lib/content/PageInfo";
import AutoPager from "./lib/content/AutoPager";

browser.runtime.sendMessage({type: "getData", value: location.href}).then(({userActive, siteinfo, prefs}) => {
  if (!userActive) {
    PageInfo.update({userActive: userActive});
  }
  
  const autoPager = AutoPager.create(siteinfo, {prefs});
  if (autoPager) {
    document.dispatchEvent(new Event("GM_AutoPagerizeLoaded", {bubbles: true}));
    
    PageInfo.log({type: "start"});
    PageInfo.update({siteinfo: autoPager.info});
    autoPager.start();
  } else {
    PageInfo.update({state: "default"});
  }
}).catch((error) => {
  // 起動時のエラーを無視
  if (error.message === "Could not establish connection. Receiving end does not exist.") {
    return;
  }
  
  PageInfo.logError(error);
  PageInfo.update({state: "error"});
});
