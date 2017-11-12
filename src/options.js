import I18n from "./lib/I18n";
import OptionManager from "./lib/background/OptionManager";

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
