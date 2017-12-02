import PageInfo from "./lib/content/PageInfo";
import AutoPager from "./lib/content/AutoPager";
import {sleep} from "./lib/util";

function initAutoPager(retryCount) {
  return browser.runtime.sendMessage({type: "getData", value: location.href}).then(({
    userActive,
    siteinfo,
    prefs,
  }) => {
    return AutoPager.create(siteinfo, {prefs}).then((autoPager) => {
      if (autoPager) {
        document.dispatchEvent(new Event("GM_AutoPagerizeLoaded", {bubbles: true}));
        
        if (!userActive) {
          PageInfo.update({userActive: userActive});
        }
        
        document.addEventListener("AutoPagerizeToggleRequest", () => {
          PageInfo.update({userActive: !PageInfo.data.userActive});
        }, false);
        document.addEventListener("AutoPagerizeEnableRequest", () => {
          PageInfo.update({userActive: true});
        }, false);
        document.addEventListener("AutoPagerizeDisableRequest", () => {
          PageInfo.update({userActive: false});
        }, false);
        
        PageInfo.log({type: "start"});
        PageInfo.update({siteinfo: autoPager.info});
        autoPager.start();
      } else {
        PageInfo.log({type: "end"});
        PageInfo.update({state: "default"});
      }
    });
  }).catch((error) => {
    if (retryCount < 5 && error && error.message === "Could not establish connection. Receiving end does not exist.") {
      return sleep(500).then(() => initAutoPager(retryCount + 1));
    }
    
    PageInfo.logError(error);
    PageInfo.update({state: "error"});
    return null;
  });
}

initAutoPager(0);
