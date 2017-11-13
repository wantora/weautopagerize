import PageInfo from "./lib/content/PageInfo";
import AutoPager from "./lib/content/AutoPager";

document.dispatchEvent(new Event("GM_AutoPagerizeLoaded", {bubbles: true}));

browser.runtime.sendMessage({type: "getData", value: location.href}).then(({userActive, siteinfo, prefs}) => {
  if (!userActive) {
    PageInfo.update({userActive: userActive});
  }
  
  try {
    const autoPager = AutoPager.create(siteinfo, {prefs});
    if (autoPager) {
      PageInfo.update({siteinfo: autoPager.info});
      autoPager.start();
    } else {
      PageInfo.update({state: "default"});
    }
  } catch (error) {
    PageInfo.update({state: "error"});
    console.error(error); // eslint-disable-line no-console
  }
});
