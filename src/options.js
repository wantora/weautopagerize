import I18n from "./lib/I18n";
import OptionManager from "./lib/background/OptionManager";
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

const TextInput = {
  load(element, value) {
    element.value = value;
  },
  save(element) {
    return element.value.trim();
  },
};

function ExcludeListValidator(value) {
  try {
    parseGlobList(value);
  } catch (error) {
    return `${error.name}: ${error.message}\n`;
  }
  return "";
}

async function AddHistoryPermitter(value) {
  if (value) {
    return browser.permissions.request({permissions: ["history"]});
  } else {
    return true;
  }
}

I18n.initHTML();

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
  {
    name: "siteinfoURL",
    updater: TextInput,
  },
]);
optionManager.init();

const siteinfoStatusElement = document.getElementById("siteinfoStatus");

async function updateSiteinfoStatus() {
  const siteinfoStatus = await browser.runtime.sendMessage({
    type: "getSiteinfoStatus",
  });
  siteinfoStatusElement.textContent = "";

  for (const {name, count, updateTime} of siteinfoStatus) {
    const dt = document.createElement("dt");
    dt.textContent = name;
    siteinfoStatusElement.appendChild(dt);

    const dd = document.createElement("dd");
    dd.textContent = browser.i18n.getMessage("options_siteinfoCount", count);
    if (updateTime) {
      dd.textContent += ` (${updateTime})`;
    }
    siteinfoStatusElement.appendChild(dd);
  }
}

document
  .getElementById("updateSiteinfoButton")
  .addEventListener("click", async () => {
    await browser.runtime.sendMessage({type: "forceUpdateSiteinfo"});
    await updateSiteinfoStatus();
  });

document
  .getElementById("openUserSiteinfoButton")
  .addEventListener("click", () => {
    open(
      browser.runtime.getURL("user-siteinfo-editor.html"),
      "weautopagerize-user-siteinfo-editor"
    );
  });

updateSiteinfoStatus();
