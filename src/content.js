import PageInfo from "./lib/content/PageInfo";
import AutoPager from "./lib/content/AutoPager";

document.dispatchEvent(new Event("GM_AutoPagerizeLoaded", {bubbles: true}));

browser.runtime.sendMessage({type: "getSiteinfo", value: location.href}).then((siteinfo) => {
  if (siteinfo === null) {
    PageInfo.update({state: "disable"});
    return;
  }
  
  try {
    const autoPager = AutoPager.create(siteinfo);
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
