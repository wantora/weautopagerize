import I18n from "./lib/I18n";
import OptionManager from "./lib/background/OptionManager";

const ArrayTextarea = {
  load(element, value) {
    element.value = value.map((s) => s.replace(/\n/g, "\\n") + "\n").join("");
  },
  save(element) {
    return element.value.replace(/^\n+/, "")
      .replace(/\n+$/, "")
      .split(/\n/)
      .filter((s) => !/^\s*$/.test(s));
  },
};

I18n.initHTML();

const optionManager = new OptionManager([
  {name: "excludeList", updater: ArrayTextarea},
]);
optionManager.init();
