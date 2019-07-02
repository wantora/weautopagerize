import I18n from "./lib/I18n";
import OptionManager from "./lib/background/OptionManager";
import SiteinfoCache from "./lib/background/SiteinfoCache";
import parseGlobList from "./lib/parseGlobList";

const BooleanCheckbox = {
  load(element, value) {
    element.checked = value;
  },
  save(element) {
    return element.checked;
  },
};

const ArrayTextarea = {
  load(element, value) {
    element.value = value.map((s) => s.replace(/\n/g, "\\n") + "\n").join("");
  },
  save(element) {
    return element.value.split(/\n/).filter((s) => !/^\s*$/.test(s));
  },
};

const ExcludeListValidator = (value) => {
  try {
    parseGlobList(value);
  } catch (error) {
    return `${error.name}: ${error.message}\n`;
  }
  return "";
};

const AddHistoryPermitter = async (value) => {
  if (value) {
    return browser.permissions.request({permissions: ["history"]});
  } else {
    return true;
  }
};

I18n.initHTML();

const siteinfoCache = new SiteinfoCache();
const optionManager = new OptionManager([
  {name: "openLinkInNewTab", updater: BooleanCheckbox},
  {
    name: "addHistory",
    updater: BooleanCheckbox,
    permitter: AddHistoryPermitter,
  },
  {
    name: "excludeList",
    updater: ArrayTextarea,
    validator: ExcludeListValidator,
  },
]);
optionManager.init();

const lastUpdatedTimeElement = document.getElementById("lastUpdatedTime");
const updateSiteinfoButton = document.getElementById("updateSiteinfoButton");
const openUserSiteinfoButton = document.getElementById(
  "openUserSiteinfoButton"
);

async function updateLastUpdatedTime() {
  const infos = await siteinfoCache.getInfo();
  lastUpdatedTimeElement.textContent = "";

  for (const {url, count, time} of infos) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.textContent = anchor;

    const element = document.createElement("div");
    const timeStr = new Date(time).toLocaleString([], {hour12: false});
    element.appendChild(anchor);
    element.appendChild(
      document.createTextNode(
        `: ${timeStr} (${browser.i18n.getMessage(
          "options_siteinfoCount",
          count
        )})`
      )
    );
    lastUpdatedTimeElement.appendChild(element);
  }
}

updateSiteinfoButton.addEventListener("click", async () => {
  await browser.runtime.sendMessage({type: "forceUpdateSiteinfo"});
  updateLastUpdatedTime();
});

openUserSiteinfoButton.addEventListener("click", () => {
  open(browser.runtime.getURL("user-siteinfo-editor.html"));
});

updateLastUpdatedTime();
