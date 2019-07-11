import I18n from "./lib/I18n";
import sleep from "./lib/sleep";
import validateURL from "./lib/validateURL";

const SITEINFO_KEYS = [
  "url",
  "nextLink",
  "pageElement",
  "insertBefore",
  "options",
  "resource_url",
];

function createLogLineElement(time, type) {
  const lineEle = document.createElement("div");
  lineEle.classList.add("line");

  const timeEle = document.createElement("span");
  timeEle.classList.add("time");
  timeEle.textContent =
    new Date(time).toLocaleTimeString("en-US", {hour12: false}) + " ";
  lineEle.appendChild(timeEle);

  const typeEle = document.createElement("span");
  typeEle.classList.add("type");
  typeEle.textContent = type;
  lineEle.appendChild(typeEle);

  return lineEle;
}

class PageInfoPanel {
  constructor() {
    this._tabId = null;
    this._port = null;

    this._userActiveButton = document.getElementById("userActive");
    this._siteinfoElement = document.getElementById("siteinfo");
    this._siteinfoElements = new Map();
    this._logListElement = document.getElementById("logList");
    this._logListKey = null;
    this._logListLength = 0;

    this._userActiveButton.addEventListener("click", () => {
      this._onUserActiveButtonClick();
    });

    document
      .getElementById("openOptionsButton")
      .addEventListener("click", () => {
        browser.runtime.openOptionsPage();
        window.close();
      });
  }
  init(tabId) {
    this._tabId = tabId;
    this._setSiteinfoWidth();
    this._initPort();
  }
  _setSiteinfoWidth() {
    let timeoutId = null;
    const listener = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const rect = this._siteinfoElement.parentNode.getBoundingClientRect();
        if (rect.width > 0) {
          window.removeEventListener("resize", listener);
          this._siteinfoElement.style.setProperty(
            "--panelWidth",
            `${rect.width}px`
          );
        }
      }, 100);
    };
    window.addEventListener("resize", listener);
  }
  _initPort() {
    this._port = browser.tabs.connect(
      this._tabId,
      {name: "pageInfoPort"}
    );
    this._port.onDisconnect.addListener(async () => {
      this._onDisconnect();
      await sleep(500);
      this._initPort();
    });
    this._port.onMessage.addListener((data) => {
      this._updateUserActive(data);
      if (data.siteinfo) {
        this._updateSiteinfo(data.siteinfo);
      }
      this._updateLogList(data);
    });
  }
  _onUserActiveButtonClick() {
    const newValue = !(
      this._userActiveButton.getAttribute("data-checked") === "true"
    );
    this._userActiveButton.setAttribute("data-checked", String(newValue));
    this._port.postMessage({userActive: newValue});
  }
  _onDisconnect() {
    this._userActiveButton.disabled = true;
  }
  _updateUserActive(data) {
    if (data.state === "enable" || data.state === "loading") {
      this._userActiveButton.disabled = false;
      this._userActiveButton.setAttribute(
        "data-checked",
        String(data.userActive)
      );
    } else {
      this._userActiveButton.disabled = true;
    }
  }
  _updateSiteinfo(siteinfo) {
    SITEINFO_KEYS.forEach((key) => {
      const value = siteinfo[key];

      if (value === undefined) {
        if (this._siteinfoElements.has(key)) {
          const {roots} = this._siteinfoElements.get(key);
          this._siteinfoElements.delete(key);
          for (const root of roots) {
            root.parentNode.removeChild(root);
          }
        }
        return;
      }

      if (!this._siteinfoElements.has(key)) {
        const keyElement = document.createElement("dt");
        keyElement.textContent = key;
        this._siteinfoElement.appendChild(keyElement);

        const valueElement = document.createElement("dd");
        this._siteinfoElement.appendChild(valueElement);

        this._siteinfoElements.set(key, {
          roots: [keyElement, valueElement],
          valueElement,
        });
      }
      const {valueElement} = this._siteinfoElements.get(key);

      if (key === "options") {
        valueElement.textContent = Object.keys(value)
          .map(
            (optionKey) => `${optionKey}: ${JSON.stringify(value[optionKey])}`
          )
          .join("\n");
      } else if (key === "resource_url" && validateURL(value)) {
        const anchor = document.createElement("a");
        anchor.href = value;
        anchor.textContent = value;

        valueElement.textContent = "";
        valueElement.appendChild(anchor);
      } else {
        valueElement.textContent = value;
      }
    });
  }
  _updateLogList({logList, logListKey, url}) {
    if (logListKey !== this._logListKey) {
      this._logListElement.textContent = "";

      {
        const line = createLogLineElement(logListKey, "info");
        const infoEle = document.createElement("span");
        infoEle.classList.add("info");
        const data = {url: url, version: browser.runtime.getManifest().version};
        infoEle.textContent = JSON.stringify(data);
        infoEle.title = JSON.stringify(data, null, 2);

        line.appendChild(document.createTextNode(": "));
        line.appendChild(infoEle);
        this._logListElement.appendChild(line);
      }

      this._logListKey = logListKey;
      this._logListLength = 0;
    }

    logList.forEach((data, index) => {
      if (index < this._logListLength) {
        return;
      }

      const line = createLogLineElement(data.time, data.type);

      if (data.type === "test") {
        const siteinfo = document.createElement("a");
        siteinfo.classList.add("siteinfo");

        if (data.siteinfo.resource_url) {
          siteinfo.href = data.siteinfo.resource_url;
        }
        const newSiteinfo = {};
        SITEINFO_KEYS.forEach((key) => {
          const value = data.siteinfo[key];
          if (value !== undefined) {
            newSiteinfo[key] = value;
          }
        });
        siteinfo.textContent = JSON.stringify(newSiteinfo);
        siteinfo.title = JSON.stringify(newSiteinfo, null, 2);

        line.appendChild(document.createTextNode(": "));
        line.appendChild(siteinfo);
      } else if (data.type === "loading") {
        const urlEle = document.createElement("a");
        urlEle.classList.add("url");
        urlEle.href = data.url;
        urlEle.title = data.url;
        urlEle.textContent = data.url;
        line.appendChild(document.createTextNode(": "));
        line.appendChild(urlEle);
      } else if (data.type === "insert") {
        const pageNo = document.createElement("span");
        pageNo.classList.add("pageNo");
        pageNo.textContent = String(data.pageNo);
        line.appendChild(document.createTextNode(": "));
        line.appendChild(pageNo);
      } else if (data.type === "error") {
        const error = document.createElement("span");
        error.classList.add("error");
        error.title = data.message;
        error.textContent = data.message;
        line.appendChild(document.createTextNode(": "));
        line.appendChild(error);
      }

      this._logListElement.appendChild(line);
    });

    this._logListElement.scrollTo(0, this._logListElement.scrollHeight);
    this._logListLength = logList.length;
  }
}

async function getActiveTab() {
  const tabs = await browser.tabs.query({currentWindow: true, active: true});
  return tabs[0];
}

(async () => {
  I18n.initHTML();

  const pageInfoPanel = new PageInfoPanel();
  const tab = await getActiveTab();
  if (tab) {
    pageInfoPanel.init(tab.id);
  }
})();
