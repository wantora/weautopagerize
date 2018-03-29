import Prefs from "./Prefs";

const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

export default class SiteinfoCache {
  async update({urls, updateFn, forceUpdate = false}) {
    let updateFlag = false;
    const {siteinfoCache} = await Prefs.get(["siteinfoCache"]);

    for (const url of Object.keys(siteinfoCache)) {
      if (!urls.includes(url)) {
        delete siteinfoCache[url];
        updateFlag = true;
      }
    }

    for (const url of urls) {
      if (
        forceUpdate ||
        !Object.prototype.hasOwnProperty.call(siteinfoCache, url) ||
        Date.now() >= siteinfoCache[url].time + CACHE_MAX_AGE
      ) {
        try {
          const newData = await updateFn(url);
          siteinfoCache[url] = {
            data: newData,
            time: Date.now(),
          };
          updateFlag = true;
        } catch (error) {
          console.error(error); // eslint-disable-line no-console
        }
      }
    }

    if (updateFlag) {
      await Prefs.set({siteinfoCache});
    }

    return urls.map((url) => {
      if (Object.prototype.hasOwnProperty.call(siteinfoCache, url)) {
        return siteinfoCache[url].data;
      } else {
        return [];
      }
    });
  }
  async getInfo() {
    const {siteinfoCache} = await Prefs.get(["siteinfoCache"]);

    return Object.entries(siteinfoCache).map(([url, {time}]) => ({url, time}));
  }
}
