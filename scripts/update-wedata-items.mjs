import {writeFileSync} from "node:fs";

const WEDATA_URL = "http://wedata.net/databases/AutoPagerize/items_all.json";

const wedataData = await (await fetch(WEDATA_URL)).text();
writeFileSync("src/webext/wedata-items.json", wedataData);
