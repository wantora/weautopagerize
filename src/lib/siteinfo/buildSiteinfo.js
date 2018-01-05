function checkInfo(info) {
  if (!info) {
    return false;
  }
  const insertBefore = info.insertBefore;
  return (
    typeof info.url === "string" &&
    typeof info.nextLink === "string" &&
    typeof info.pageElement === "string" &&
    (insertBefore === undefined || insertBefore === null || typeof insertBefore === "string")
  );
}

export default function buildSiteinfo(siteinfo, options = {}) {
  const {errorCallback} = Object.assign({
    errorCallback(error) {
      console.error(error); // eslint-disable-line no-console
    },
  }, options);
  
  if (siteinfo === null) {
    return [];
  }
  if (!Array.isArray(siteinfo)) {
    errorCallback(new Error(`invalid SITEINFO: ${JSON.stringify(siteinfo)}`));
    return [];
  }
  
  const newSiteinfo = [];
  
  siteinfo.forEach((entry) => {
    let info = null;
    let resourceURL = null;
    
    if (checkInfo(entry)) {
      info = entry;
    } else if (entry && checkInfo(entry.data)) {
      info = entry.data;
      if (typeof entry["resource_url"] === "string") {
        resourceURL = entry["resource_url"];
      }
    } else {
      errorCallback(new Error(`invalid SITEINFO item: ${JSON.stringify(entry)}`));
      return;
    }
    
    try {
      newSiteinfo.push({
        "url": info.url,
        "urlRegExp": new RegExp(info.url),
        "nextLink": info.nextLink,
        "pageElement": info.pageElement,
        "insertBefore": info.insertBefore === undefined ? null : info.insertBefore,
        "options": info.options === undefined ? null : info.options,
        "resource_url": resourceURL,
      });
    } catch (error) {
      errorCallback(error);
    }
  });
  
  return newSiteinfo;
}
