import PageInfo from "./lib/content/PageInfo";
import AutoPager from "./lib/content/AutoPager";
import fetchHTMLText from "./lib/content/fetchHTMLText";
import {sleep, sleepVisible, parseHTMLDocument} from "./lib/util";

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

async function initAutoPager(retryCount) {
  try {
    const {
      userActive,
      siteinfo,
      prefs,
    } = await browser.runtime.sendMessage({type: "getData", value: location.href});
    
    const autoPager = await createAutoPager(siteinfo, {prefs});
    if (autoPager) {
      document.dispatchEvent(new Event("GM_AutoPagerizeLoaded", {bubbles: true}));
      
      if (!userActive) {
        PageInfo.update({userActive: userActive});
      }
      
      document.addEventListener("AutoPagerizeToggleRequest", () => {
        PageInfo.update({userActive: !PageInfo.data.userActive});
      });
      document.addEventListener("AutoPagerizeEnableRequest", () => {
        PageInfo.update({userActive: true});
      });
      document.addEventListener("AutoPagerizeDisableRequest", () => {
        PageInfo.update({userActive: false});
      });
      
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

initAutoPager(0);
