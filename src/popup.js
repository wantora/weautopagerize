import I18n from "./lib/I18n";

class PageInfoPanel {
  constructor() {
    this._tabId = null;
    this._port = null;
    
    this._userActiveButton = document.getElementById("userActive");
    this._siteinfoElement = document.getElementById("siteinfo");
    this._siteinfoElements = new Map();
    this._insertPagesElement = document.getElementById("insertPages");
    this._insertPages = new Map();
    
    document.getElementById("openOptionsButton").addEventListener("click", () => {
      browser.runtime.openOptionsPage();
      window.close();
    });
  }
  init(tabId) {
    this._tabId = tabId;
    
    this._port = browser.tabs.connect(this._tabId, {name: "pageInfoPort"});
    this._port.onDisconnect.addListener((p) => {
      this._onDisconnect();
    });
    this._port.onMessage.addListener((data) => {
      this._updateUserActive(data);
      if (data.siteinfo) {
        this._updateSiteinfo(data.siteinfo);
      }
      if (data.insertPages) {
        this._updateInsertPages(data.insertPages);
      }
    });
    
    this._userActiveButton.addEventListener("click", () => {
      this._onUserActiveButtonClick();
    });
  }
  _onUserActiveButtonClick() {
    const newValue = !(this._userActiveButton.getAttribute("data-checked") === "true");
    this._userActiveButton.setAttribute("data-checked", String(newValue));
    this._port.postMessage({userActive: newValue});
  }
  _onDisconnect() {
    this._userActiveButton.disabled = true;
  }
  _updateUserActive(data) {
    if (data.state === "enable" || data.state === "loading") {
      this._userActiveButton.disabled = false;
      this._userActiveButton.setAttribute("data-checked", String(data.userActive));
    } else {
      this._userActiveButton.disabled = true;
    }
  }
  _updateSiteinfo(siteinfo) {
    ["url", "nextLink", "pageElement", "insertBefore"].forEach((key) => {
      if (siteinfo[key] === null) {
        return;
      }
      if (!this._siteinfoElements.has(key)) {
        const dt = document.createElement("dt");
        dt.textContent = key;
        this._siteinfoElement.appendChild(dt);
        
        const dd = document.createElement("dd");
        this._siteinfoElement.appendChild(dd);
        
        this._siteinfoElements.set(key, dd);
      }
      this._siteinfoElements.get(key).textContent = siteinfo[key];
    });
  }
  _updateInsertPages(insertPages) {
    insertPages.forEach(({url, pageNo}) => {
      if (this._insertPages.has(pageNo)) {
        return;
      }
      this._insertPages.set(pageNo, url);
      
      const li = document.createElement("li");
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.textContent = url;
      li.appendChild(anchor);
      this._insertPagesElement.appendChild(li);
    });
  }
}

function getActiveTab() {
  return browser.tabs.query({currentWindow: true, active: true}).then((tabs) => tabs[0]);
}

I18n.initHTML();

const pageInfoPanel = new PageInfoPanel();

getActiveTab().then((tab) => {
  if (tab) {
    pageInfoPanel.init(tab.id);
  }
});
