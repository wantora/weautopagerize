"use strict";
const fs = require("fs");
const childProcess = require("child_process");
const fetch = require("node-fetch");

const WEDATA_URL = "http://wedata.net/databases/AutoPagerize/items_all.json";

(async () => {
  const packageData = JSON.parse(
    fs.readFileSync("package.json", {encoding: "utf8"})
  );

  const manifestStr = fs.readFileSync("src/webext/manifest.json", {
    encoding: "utf8",
  });
  fs.writeFileSync(
    "src/webext/manifest.json",
    manifestStr.replace(
      /("version"\s*:\s*")[^"]*(")/,
      (_, p1, p2) => p1 + packageData.version + p2
    )
  );

  const wedataData = await (await fetch(WEDATA_URL)).text();
  fs.writeFileSync("src/webext/wedata-items.json", wedataData);

  childProcess.execSync(
    `git add src/webext/manifest.json src/webext/wedata-items.json`,
    {
      stdio: "inherit",
    }
  );
})();
