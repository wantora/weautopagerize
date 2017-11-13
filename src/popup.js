class PageInfoPanel {
  constructor(tabId) {
    this._tabId = tabId;
    this._userActiveButton = document.getElementById("userActive");
  }
  init() {
    const port = browser.tabs.connect(this._tabId, {name: "pageInfoPort"});
    port.onDisconnect.addListener((p) => {
      this._userActiveButton.disabled = true;
    });
    
    port.onMessage.addListener((data) => {
      if (data.state === "enable" || data.state === "loading") {
        this._userActiveButton.disabled = false;
        this._userActiveButton.setAttribute("data-checked", String(data.userActive));
      } else {
        this._userActiveButton.disabled = true;
      }
    });
    
    this._userActiveButton.addEventListener("click", () => {
      const newValue = !(this._userActiveButton.getAttribute("data-checked") === "true");
      this._userActiveButton.setAttribute("data-checked", String(newValue));
      port.postMessage({userActive: newValue});
    });
  }
}

function getActiveTab() {
  return browser.tabs.query({currentWindow: true, active: true}).then((tabs) => tabs[0]);
}

getActiveTab().then((tab) => {
  if (tab) {
    const pageInfoPanel = new PageInfoPanel(tab.id);
    pageInfoPanel.init();
  }
});
