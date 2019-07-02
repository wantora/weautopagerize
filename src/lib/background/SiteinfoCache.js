import Prefs, {WEDATA_URL} from "./Prefs";

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

    await Promise.all(
      urls
        .filter(
          (url) =>
            forceUpdate ||
            !Object.prototype.hasOwnProperty.call(siteinfoCache, url) ||
            Date.now() >= siteinfoCache[url].time + CACHE_MAX_AGE
        )
        .map(async (url) => {
          try {
            const newData = await updateFn(url);
            siteinfoCache[url] = {
              data: newData,
              time: Date.now(),
            };
            updateFlag = true;
          } catch (error) {
            console.error(error); // eslint-disable-line no-console

            if (
              url === WEDATA_URL &&
              !Object.prototype.hasOwnProperty.call(siteinfoCache, url)
            ) {
              try {
                const localData = await (await fetch(
                  browser.runtime.getURL("wedata-items.json")
                )).json();

                siteinfoCache[url] = {
                  data: localData,
                  time: new Date(0),
                };
                updateFlag = true;
              } catch (err2) {
                console.error(err2); // eslint-disable-line no-console
              }
            }
          }
        })
    );

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

    return Object.entries(siteinfoCache).map(([url, {data, time}]) => ({
      url,
      count: parseInt(data && data.length, 10),
      time,
    }));
  }
}
