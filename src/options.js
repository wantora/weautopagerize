import I18n from "./lib/I18n";
import OptionManager from "./lib/background/OptionManager";
import Prefs from "./lib/background/Prefs";

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

I18n.initHTML();

const optionManager = new OptionManager([
  {name: "openLinkInNewTab", updater: BooleanCheckbox},
  {name: "excludeList", updater: ArrayTextarea},
]);
optionManager.init();

const lastUpdatedTimeElement = document.getElementById("lastUpdatedTime");
const updateSiteinfoButton = document.getElementById("updateSiteinfoButton");

function updateLastUpdatedTime() {
  Prefs.get(["siteinfoCache"]).then(({siteinfoCache}) => {
    const times = Object.values(siteinfoCache).map((d) => d.time);
    
    if (times.length === 0) {
      lastUpdatedTimeElement.textContent = "";
    } else {
      const timeStr = new Date(Math.max(...times)).toLocaleString([], {hour12: false});
      lastUpdatedTimeElement.textContent = timeStr;
    }
  });
}

updateSiteinfoButton.addEventListener("click", () => {
  browser.runtime.sendMessage({type: "forceUpdateSiteinfo"}).then(() => {
    updateLastUpdatedTime();
  });
});

updateLastUpdatedTime();
