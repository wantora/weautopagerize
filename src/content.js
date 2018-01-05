import PageInfo from "./lib/content/PageInfo";
import AutoPager from "./lib/content/AutoPager";
import fetchHTMLText from "./lib/content/fetchHTMLText";
import buildSiteinfo from "./lib/siteinfo/buildSiteinfo";
import sleep from "./lib/sleep";
import sleepDOMContentLoaded from "./lib/content/sleepDOMContentLoaded";
import sleepVisible from "./lib/content/sleepVisible";
import parseHTMLDocument from "./lib/content/parseHTMLDocument";

async function getContinueAutoPager(info, options) {
  try {
    const links = Array.from(document.querySelectorAll("a.autopagerize_link[href]"));
    if (links.length === 0) {
      return null;
    }
    const lastLink = links[links.length - 1];
    const pageNo = parseInt(lastLink.textContent, 10);
    if (Number.isNaN(pageNo)) {
      return null;
    }
    const url = new URL(lastLink.href);
    const loadedURLs = links.map((link) => link.href);
    loadedURLs.push(location.href);
    
    await sleepVisible();
    
    const {realURL, text} = await fetchHTMLText(url);
    const doc = parseHTMLDocument(text);
    return new AutoPager(info, realURL, doc, Object.assign({}, options, {
      loadedURLs: loadedURLs,
      pageNo: pageNo,
    }));
  } catch (error) {
    return null;
  }
}

async function createAutoPager(siteinfo, options) {
  const url = new URL(location.href);
  
  for (const info of siteinfo) {
    const autoPager = new AutoPager(info, url, document, options);
    PageInfo.log({type: "test", siteinfo: info});
    
    if (autoPager.test()) {
      return (await getContinueAutoPager(info, options)) || autoPager;
    }
  }
  return null;
}

let currentData = null;
let eventSiteinfo = null;

function initEventListener() {
  document.addEventListener("AutoPagerizeToggleRequest", () => {
    PageInfo.update({userActive: !PageInfo.data.userActive});
  });
  document.addEventListener("AutoPagerizeEnableRequest", () => {
    PageInfo.update({userActive: true});
  });
  document.addEventListener("AutoPagerizeDisableRequest", () => {
    PageInfo.update({userActive: false});
  });
  
  document.addEventListener("AutoPagerize_launchAutoPager", async (ev) => {
    const siteinfo = ev.detail && ev.detail.siteinfo;
    
    try {
      eventSiteinfo = buildSiteinfo(siteinfo).filter((info) => info.urlRegExp.test(location.href));
      
      if (currentData) {
        const {prefs} = currentData;
        const autoPager = await createAutoPager(eventSiteinfo, {prefs});
        if (autoPager) {
          if (!autoPager.nextURLIsLoaded() && autoPager.test()) {
            AutoPager.terminateAll();
            PageInfo.log({type: "start"});
            PageInfo.update({siteinfo: autoPager.info});
            
            autoPager.start();
          }
        }
      }
    } catch (error) {
      PageInfo.logError(error);
      PageInfo.update({state: "error"});
    }
  });
}

async function initAutoPager(retryCount = 0) {
  try {
    const {
      userActive,
      siteinfo,
      prefs,
    } = await browser.runtime.sendMessage({type: "getData", value: location.href});
    currentData = {prefs};
    
    if (!userActive) {
      PageInfo.update({userActive: userActive});
    }
    
    const si = eventSiteinfo ? eventSiteinfo.concat(siteinfo) : siteinfo;
    const autoPager = await createAutoPager(si, {prefs});
    if (autoPager) {
      PageInfo.log({type: "start"});
      PageInfo.update({siteinfo: autoPager.info});
      
      if (!autoPager.nextURLIsLoaded() && autoPager.test()) {
        autoPager.start();
        return;
      }
    }
    PageInfo.log({type: "end"});
    PageInfo.update({state: "default"});
  } catch (error) {
    if (retryCount < 5 && error && error.message === "Could not establish connection. Receiving end does not exist.") {
      await sleep(500);
      await initAutoPager(retryCount + 1);
    } else {
      PageInfo.logError(error);
      PageInfo.update({state: "error"});
    }
  }
}

initEventListener();

sleepDOMContentLoaded().then(() => {
  document.dispatchEvent(new Event("GM_AutoPagerizeLoaded", {bubbles: true}));
  initAutoPager();
});
