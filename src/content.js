import Info from "./lib/content/Info";
import AutoPager from "./lib/content/AutoPager";

document.dispatchEvent(new Event("GM_AutoPagerizeLoaded", {bubbles: true}));

browser.runtime.sendMessage({type: "getSiteinfo", url: location.href}).then((siteinfo) => {
  if (siteinfo === null) {
    Info.updateStatus("off");
    return;
  }
  
  try {
    const autoPager = AutoPager.create(siteinfo);
    if (autoPager) {
      autoPager.start();
    }
  } catch (error) {
    Info.updateStatus("error");
    console.error(error); // eslint-disable-line no-console
  }
});
