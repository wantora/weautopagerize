import I18n from "./lib/I18n";
import {sleep, validateURL} from "./lib/util";

const SITEINFO_KEYS = ["url", "nextLink", "pageElement", "insertBefore", "resource_url"];

class PageInfoPanel {
  constructor() {
    this._tabId = null;
    this._port = null;
    
    this._userActiveButton = document.getElementById("userActive");
    this._siteinfoElement = document.getElementById("siteinfo");
    this._siteinfoElements = new Map();
    this._logListElement = document.getElementById("logList");
    this._logListLength = 0;
    
    this._userActiveButton.addEventListener("click", () => {
      this._onUserActiveButtonClick();
    });
    
    document.getElementById("openOptionsButton").addEventListener("click", () => {
      browser.runtime.openOptionsPage();
      window.close();
    });
  }
  init(tabId) {
    this._tabId = tabId;
    this._initPort();
  }
  _initPort() {
    this._port = browser.tabs.connect(this._tabId, {name: "pageInfoPort"});
    this._port.onDisconnect.addListener(() => {
      this._onDisconnect();
      
      sleep(500).then(() => {
        this._initPort();
      });
    });
    this._port.onMessage.addListener((data) => {
      this._updateUserActive(data);
      if (data.siteinfo) {
        this._updateSiteinfo(data.siteinfo);
      }
      if (data.logList) {
        this._updateLogList(data.logList);
      }
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
    SITEINFO_KEYS.forEach((key) => {
      const value = siteinfo[key];
      if (value === null) {
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
      const element = this._siteinfoElements.get(key);
      
      if (key === "resource_url" && validateURL(value)) {
        const anchor = document.createElement("a");
        anchor.href = value;
        anchor.textContent = value;
        element.textContent = "";
        element.appendChild(anchor);
      } else {
        element.textContent = value;
      }
    });
  }
  _updateLogList(logList) {
    logList.forEach((data, index) => {
      if (index < this._logListLength) {
        return;
      }
      
      const line = document.createElement("div");
      line.classList.add("line");
      
      const time = document.createElement("span");
      time.classList.add("time");
      time.textContent = new Date(data.time).toLocaleTimeString("en-US", {hour12: false}) + " ";
      line.appendChild(time);
      
      const type = document.createElement("span");
      type.classList.add("type");
      type.textContent = data.type;
      line.appendChild(type);
      
      if (data.type === "test") {
        const siteinfo = document.createElement("a");
        siteinfo.classList.add("siteinfo");
        
        if (data.siteinfo.resource_url) {
          siteinfo.href = data.siteinfo.resource_url;
        }
        const newSiteinfo = {};
        SITEINFO_KEYS.forEach((key) => {
          const value = data.siteinfo[key];
          if (value !== null) {
            newSiteinfo[key] = value;
          }
        });
        siteinfo.textContent = JSON.stringify(newSiteinfo);
        siteinfo.title = JSON.stringify(newSiteinfo, null, 2);
        
        line.appendChild(document.createTextNode(": "));
        line.appendChild(siteinfo);
      } else if (data.type === "loading") {
        const url = document.createElement("a");
        url.classList.add("url");
        url.href = data.url;
        url.title = data.url;
        url.textContent = data.url;
        line.appendChild(document.createTextNode(": "));
        line.appendChild(url);
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
      this._logListElement.scrollTo(0, this._logListElement.scrollHeight);
    });
    this._logListLength = logList.length;
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
