import SiteinfoManager from "./lib/background/SiteinfoManager";
import ExcludeList from "./lib/background/ExcludeList";
import Prefs from "./lib/background/Prefs";
import updateButtonState from "./lib/background/updateButtonState";

const siteinfoManager = new SiteinfoManager();
const excludeList = new ExcludeList();

async function gatUserActive(urlStr, tabId) {
  const {globalDisable} = await Prefs.get(["globalDisable"]);
  const tabDisable = JSON.parse(
    (await browser.sessions.getTabValue(tabId, "tabDisable")) || "false"
  );
  const isExclude = excludeList.check(urlStr);

  return !globalDisable && !tabDisable && !isExclude;
}

async function updateUserActive(tabId) {
  const port = browser.tabs.connect(
    tabId,
    {name: "pageInfoPort"}
  );
  const data = await new Promise((resolve, reject) => {
    port.onMessage.addListener(resolve);
  });
  const userActive = await gatUserActive(data.url, tabId);
  port.postMessage({userActive});
  port.disconnect();
}

async function initContextmenu() {
  const {globalDisable} = await Prefs.get(["globalDisable"]);

  browser.menus.create({
    id: "globalDisableMenu",
    title: browser.i18n.getMessage("browserAction_menu_globalDisable"),
    type: "checkbox",
    checked: globalDisable,
    contexts: ["browser_action"],
    async onclick(info) {
      await Prefs.set({globalDisable: info.checked});
      const tabs = await browser.tabs.query({});
      await Promise.all(tabs.map((t) => updateUserActive(t.id)));
    },
  });

  browser.menus.create({
    id: "tabDisableMenu",
    title: browser.i18n.getMessage("browserAction_menu_tabDisable"),
    type: "checkbox",
    contexts: ["browser_action"],
    async onclick(info, tab) {
      await browser.sessions.setTabValue(
        tab.id,
        "tabDisable",
        JSON.stringify(info.checked)
      );
      await updateUserActive(tab.id);
    },
  });

  let lastMenuInstanceId = 0;
  let nextMenuInstanceId = 1;
  browser.menus.onShown.addListener(async (info, tab) => {
    if (!info.menuIds.includes("tabDisableMenu")) {
      return;
    }
    const menuInstanceId = nextMenuInstanceId++;
    lastMenuInstanceId = menuInstanceId;

    const tabDisable = JSON.parse(
      (await browser.sessions.getTabValue(tab.id, "tabDisable")) || "false"
    );

    if (menuInstanceId !== lastMenuInstanceId) {
      return;
    }
    browser.menus.update("tabDisableMenu", {checked: tabDisable});
    browser.menus.refresh();
  });
  browser.menus.onHidden.addListener(() => {
    lastMenuInstanceId = 0;
  });
}

(async () => {
  try {
    await Promise.all([siteinfoManager.init(), excludeList.init()]);

    browser.runtime.onMessage.addListener(async (message, sender) => {
      if (message) {
        if (message.type === "getData") {
          const urlStr = message.value;
          const prefs = await Prefs.get(["openLinkInNewTab", "addHistory"]);
          const userActive = await gatUserActive(urlStr, sender.tab.id);

          const data = {
            userActive: userActive,
            siteinfo: siteinfoManager.getSiteinfo(urlStr),
            prefs: prefs,
          };
          return data;
        } else if (message.type === "setButtonState") {
          if (sender.tab) {
            return updateButtonState(sender.tab.id, message.value);
          }
        } else if (message.type === "forceUpdateSiteinfo") {
          return siteinfoManager.forceUpdateSiteinfo();
        } else if (message.type === "addBrowserHistory") {
          if (!sender.tab.incognito) {
            return browser.history.addUrl(message.value);
          }
        }
      }
      return null;
    });

    await initContextmenu();
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
  }
})();
