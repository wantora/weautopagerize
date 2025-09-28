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

const siteinfoStatusElement = document.getElementById("siteinfoStatus");
const openUserSiteinfoButton = document.getElementById(
  "openUserSiteinfoButton"
);

async function updateSiteinfoStatus() {
  const siteinfoStatus = await browser.runtime.sendMessage({
    type: "getSiteinfoStatus",
  });
  siteinfoStatusElement.textContent = "";

  for (const {name, count} of siteinfoStatus) {
    const element = document.createElement("div");
    element.textContent = `${name}: ${browser.i18n.getMessage(
      "options_siteinfoCount",
      count
    )}`;
    siteinfoStatusElement.appendChild(element);
  }
}

openUserSiteinfoButton.addEventListener("click", () => {
  open(
    browser.runtime.getURL("user-siteinfo-editor.html"),
    "weautopagerize-user-siteinfo-editor"
  );
});

updateSiteinfoStatus();
