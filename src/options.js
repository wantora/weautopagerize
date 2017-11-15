import I18n from "./lib/I18n";
import OptionManager from "./lib/background/OptionManager";
import Prefs from "./lib/background/Prefs";
import {parseGlob} from "./lib/util";
import {parseSiteinfo, buildSiteinfo} from "./lib/background/SiteinfoManager";

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

const StringTextarea = {
  load(element, value) {
    element.value = value;
  },
  save(element) {
    return element.value;
  },
};

const ExcludeListValidator = (value) => {
  let message = "";
  value.forEach((str) => {
    try {
      parseGlob(str);
    } catch (error) {
      message += `${error.name}: ${error.message}\n`;
    }
  });
  return message;
};

const UserSiteinfoValidator = (value) => {
  let message = "";
  try {
    buildSiteinfo(parseSiteinfo(value), (error) => {
      message += `${error.name}: ${error.message}\n`;
    });
  } catch (error) {
    message += `${error.name}: ${error.message}\n`;
  }
  return message;
};

I18n.initHTML();

const optionManager = new OptionManager([
  {name: "openLinkInNewTab", updater: BooleanCheckbox},
  {name: "excludeList", updater: ArrayTextarea, validator: ExcludeListValidator},
  {name: "userSiteinfo", updater: StringTextarea, validator: UserSiteinfoValidator},
]);
optionManager.init();

const lastUpdatedTimeElement = document.getElementById("lastUpdatedTime");
const updateSiteinfoButton = document.getElementById("updateSiteinfoButton");

function updateLastUpdatedTime() {
  Prefs.get(["siteinfoCache"]).then(({siteinfoCache}) => {
    lastUpdatedTimeElement.textContent = "";
    
    Object.entries(siteinfoCache).forEach(([url, {time}]) => {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.textContent = anchor;
      
      const element = document.createElement("div");
      const timeStr = new Date(time).toLocaleString([], {hour12: false});
      element.appendChild(document.createTextNode(`${timeStr} (`));
      element.appendChild(anchor);
      element.appendChild(document.createTextNode(")"));
      lastUpdatedTimeElement.appendChild(element);
    });
  });
}

updateSiteinfoButton.addEventListener("click", () => {
  browser.runtime.sendMessage({type: "forceUpdateSiteinfo"}).then(() => {
    updateLastUpdatedTime();
  });
});

updateLastUpdatedTime();
