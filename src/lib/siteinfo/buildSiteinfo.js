function checkInfo(info) {
  if (!info) {
    return false;
  }
  const insertBefore = info.insertBefore;
  return (
    typeof info.url === "string" &&
    typeof info.nextLink === "string" &&
    typeof info.pageElement === "string" &&
    (insertBefore === undefined ||
      insertBefore === null ||
      typeof insertBefore === "string")
  );
}

export default function buildSiteinfo(siteinfo, options = {}) {
  const {errorCallback} = Object.assign(
    {
      errorCallback(error) {
        console.error(error);
      },
    },
    options
  );

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
      errorCallback(
        new Error(`invalid SITEINFO item: ${JSON.stringify(entry)}`)
      );
      return;
    }

    try {
      const newInfo = {
        url: info.url,
        urlRegExp: new RegExp(info.url),
        nextLink: info.nextLink,
        pageElement: info.pageElement,
      };

      const insertBefore = info.insertBefore;
      if (insertBefore !== undefined && insertBefore !== null) {
        newInfo["insertBefore"] = insertBefore;
      }
      const infoOptions = info.options;
      if (infoOptions !== undefined && infoOptions !== null) {
        newInfo["options"] = infoOptions;
      }
      if (resourceURL !== null) {
        newInfo["resource_url"] = resourceURL;
      }

      newSiteinfo.push(newInfo);
    } catch (error) {
      errorCallback(error);
    }
  });

  return newSiteinfo;
}
