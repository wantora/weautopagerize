import I18n from "./lib/I18n";
import OptionManager from "./lib/background/OptionManager";
import buildSiteinfo from "./lib/siteinfo/buildSiteinfo";
import parseUserSiteinfo from "./lib/siteinfo/parseUserSiteinfo";

const StringTextarea = {
  load(element, value) {
    element.value = value;
  },
  save(element) {
    return element.value;
  },
};

const UserSiteinfoValidator = (value) => {
  let message = "";
  try {
    buildSiteinfo(parseUserSiteinfo(value), {
      errorCallback(error) {
        message += `${error.name}: ${error.message}\n`;
      },
    });
  } catch (error) {
    message += `${error.name}: ${error.message}\n`;
  }
  return message;
};

I18n.initHTML();

const optionManager = new OptionManager([
  {
    name: "userSiteinfo",
    updater: StringTextarea,
    validator: UserSiteinfoValidator,
  },
]);
optionManager.init();
