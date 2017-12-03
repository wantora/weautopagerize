import PageInfo from "./lib/content/PageInfo";
import AutoPager from "./lib/content/AutoPager";
import HTTPRequest from "./lib/content/HTTPRequest";
import {sleep} from "./lib/util";

function getContinueAutoPager(info, options) {
  try {
    const links = Array.from(document.querySelectorAll("a.autopagerize_link[href]"));
    if (links.length === 0) {
      return Promise.resolve(null);
    }
    const lastLink = links[links.length - 1];
    const url = new URL(lastLink.href);
    const pageNo = parseInt(lastLink.textContent, 10);
    if (Number.isNaN(pageNo)) {
      return Promise.resolve(null);
    }
    
    return HTTPRequest.getDocument(url).then(({realURL, doc}) => {
      const nextAutoPager = new AutoPager(info, realURL, doc, Object.assign({}, options, {
        pageNo: pageNo,
      }));
      
      if (nextAutoPager.test()) {
        return nextAutoPager;
      } else {
        return null;
      }
    }).catch(() => null);
  } catch (error) {
    return Promise.resolve(null);
  }
}

function createAutoPager(siteinfo, options) {
  const url = new URL(location.href);
  
  for (const info of siteinfo) {
    const autoPager = new AutoPager(info, url, document, options);
    PageInfo.log({type: "test", siteinfo: info});
    
    if (autoPager.test()) {
      return getContinueAutoPager(info, options).then((cont) => {
        return cont || autoPager;
      });
    }
  }
  return Promise.resolve(null);
}

function initAutoPager(retryCount) {
  return browser.runtime.sendMessage({type: "getData", value: location.href}).then(({
    userActive,
    siteinfo,
    prefs,
  }) => {
    return createAutoPager(siteinfo, {prefs}).then((autoPager) => {
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
